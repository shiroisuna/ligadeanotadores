const pool = require('../config/db');

// El box score es la ÚNICA carga de datos del juego. Al guardarlo se
// generan automáticamente las estadísticas (est_bateo, est_fildeo,
// est_pitcheo) como PENDIENTES (aprobado = 0) para que el administrador
// las revise, las corrija si hace falta y las apruebe.

// Una fila por jugador POR POSICIÓN jugada (bateo + fildeo de esa posición).
// AL, BA y TL se calculan en el servidor, no se cargan.
const CAMPOS_BATEO = [
  'posicion', 'vb', 'ca', 'hc', 'bb', 'sh', 'sf', 'gp', 'in_', 'al',
  'h2', 'h3', 'hr', 'ba', 'ci', 'br', 'or_', 'so', 'ij', 'o', 'a', 'e', 'tl', 'dp', 'di',
  'pb', 'ir', 'or_c',
];

// Orden del box score físico: I, R, C, B, G, P, S, E, T.L, VB, HP, H2, H3, HR, IL, CP, CL, SO, BB, BI, SH, SF, GP, WP, BK
const CAMPOS_PITCHEO = [
  'i', 'r', 'c', 'b', 'g', 'p', 's', 'e', 'tl', 'vb_enfrentados', 'hp', 'h2', 'h3', 'hr', 'il',
  'cp', 'cl', 'so', 'bb', 'bi', 'sh', 'sf', 'gp', 'wp', 'bk',
];

// Posiciones que generan fildeo (DH y BA solo batean)
const POSICIONES_FILDEO = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SHF'];

const num = (v) => Number(v) || 0;
// Innings: siempre en tercios (0.33 = 1/3, 0.67 = 2/3), así 0.33 + 0.33 + 0.33 = 1
const tercios = (v) => Math.round(Math.round(num(v) * 3) / 3 * 100) / 100;
const CAMPOS_INNINGS = ['il', 'ij'];

async function obtenerBateoPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT bj.*, j.nombres, j.apellidos, r.numero_camiseta
     FROM bateo_juego bj
     JOIN roster r ON r.id = bj.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE bj.juego_id = ?
     ORDER BY bj.id`,
    [juego_id]
  );
  return rows;
}

async function obtenerPitcheoPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT pj.*, j.nombres, j.apellidos, r.numero_camiseta
     FROM pitcheo_juego pj
     JOIN roster r ON r.id = pj.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE pj.juego_id = ?
     ORDER BY pj.id`,
    [juego_id]
  );
  return rows;
}

// Si llegan dos filas del mismo jugador (y misma posición) se suman.
function combinarDuplicadas(lineas, clave, campos) {
  const mapa = new Map();
  for (const l of lineas) {
    const k = clave(l);
    if (!mapa.has(k)) { mapa.set(k, { ...l }); continue; }
    const acc = mapa.get(k);
    for (const c of campos) {
      if (c === 'posicion') continue;
      acc[c] = CAMPOS_INNINGS.includes(c) ? tercios(num(acc[c]) + num(l[c])) : num(acc[c]) + num(l[c]);
    }
  }
  return [...mapa.values()];
}

async function insertarFilas(conn, tabla, campos, juego_id, lineas) {
  const columnas = ['juego_id', 'roster_id', ...campos];
  const placeholders = columnas.map(() => '?').join(', ');
  for (const linea of lineas) {
    const valores = [juego_id, linea.roster_id, ...campos.map((c) => (c === 'posicion' ? (linea.posicion || null) : num(linea[c])))];
    await conn.execute(`INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${placeholders})`, valores);
  }
}

// ── Sincronización box score → estadísticas (quedan pendientes) ─────────

async function sincronizarBateoYFildeo(conn, juego_id) {
  await conn.execute('DELETE FROM est_bateo WHERE juego_id = ?', [juego_id]);
  await conn.execute(
    `INSERT INTO est_bateo (juego_id, roster_id, aprobado, vb, ca, hc, bb, sh, sf, gp, in_, al,
                            h2, h3, hr, ba, ci, br, or_, so)
     SELECT juego_id, roster_id, 0,
            SUM(vb), SUM(ca), SUM(hc), SUM(bb), SUM(sh), SUM(sf), SUM(gp), SUM(in_),
            SUM(vb + bb + sh + sf + gp + in_),
            SUM(h2), SUM(h3), SUM(hr),
            SUM(hc + h2 + 2 * h3 + 3 * hr),
            SUM(ci), SUM(br), SUM(or_), SUM(so)
     FROM bateo_juego
     WHERE juego_id = ?
     GROUP BY juego_id, roster_id`,
    [juego_id]
  );

  await conn.execute('DELETE FROM est_fildeo WHERE juego_id = ?', [juego_id]);
  const enLista = POSICIONES_FILDEO.map(() => '?').join(', ');
  await conn.execute(
    `INSERT INTO est_fildeo (juego_id, roster_id, aprobado, posicion, ij, o, a, e, tl, dp, di, pb, ir, or_)
     SELECT juego_id, roster_id, 0, posicion,
            SUM(ij), SUM(o), SUM(a), SUM(e), SUM(o + a + e), SUM(dp), SUM(di),
            SUM(pb), SUM(ir), SUM(or_c)
     FROM bateo_juego
     WHERE juego_id = ? AND posicion IN (${enLista})
     GROUP BY juego_id, roster_id, posicion`,
    [juego_id, ...POSICIONES_FILDEO]
  );
}

async function sincronizarPitcheo(conn, juego_id) {
  await conn.execute('DELETE FROM est_pitcheo WHERE juego_id = ?', [juego_id]);
  await conn.execute(
    `INSERT INTO est_pitcheo (juego_id, roster_id, aprobado, g, p, s, e, i, r, c, b,
                              vb, hp, h2, h3, hr, il, cp, cl, so, bb, bi, sh, sf, gp, wp, bk, tl)
     SELECT juego_id, roster_id, 0, g, p, s, e, i, r, c, b,
            vb_enfrentados, hp, h2, h3, hr, il, cp, cl, so, bb, bi, sh, sf, gp, wp, bk, tl
     FROM pitcheo_juego
     WHERE juego_id = ?`,
    [juego_id]
  );
}

// Carreras (de la línea de anotación), hits y errores (del bateo/fildeo)
// pasan al resultado del juego, que vuelve a quedar pendiente de aprobación.
async function actualizarResultadoDesdeBoxscore(conn, juego_id, usuario) {
  const [[juego]] = await conn.execute(
    'SELECT id, estado, equipo_local_id, equipo_visitante_id FROM juegos WHERE id = ?', [juego_id]
  );
  if (!juego) return;

  const [entradas] = await conn.execute(
    `SELECT equipo_inscrito_id, SUM(carreras) AS carreras
     FROM entradas_juego WHERE juego_id = ? GROUP BY equipo_inscrito_id`, [juego_id]
  );
  const [bateo] = await conn.execute(
    `SELECT r.equipo_inscrito_id, SUM(bj.hc) AS hits, SUM(bj.e) AS errores, COUNT(*) AS filas
     FROM bateo_juego bj JOIN roster r ON r.id = bj.roster_id
     WHERE bj.juego_id = ? GROUP BY r.equipo_inscrito_id`, [juego_id]
  );

  const sets = ['resultado_aprobado = 0'];
  const valores = [];
  const de = (lista, id, campo) => {
    const f = lista.find((x) => Number(x.equipo_inscrito_id) === Number(id));
    return f ? num(f[campo]) : 0;
  };

  if (entradas.length) {
    sets.push('carreras_local = ?', 'carreras_visitante = ?');
    valores.push(de(entradas, juego.equipo_local_id, 'carreras'), de(entradas, juego.equipo_visitante_id, 'carreras'));
    if (juego.estado === 'programado') sets.push("estado = 'jugado'");
  }
  if (bateo.length) {
    sets.push('hits_local = ?', 'hits_visitante = ?', 'errores_local = ?', 'errores_visitante = ?');
    valores.push(
      de(bateo, juego.equipo_local_id, 'hits'), de(bateo, juego.equipo_visitante_id, 'hits'),
      de(bateo, juego.equipo_local_id, 'errores'), de(bateo, juego.equipo_visitante_id, 'errores'),
    );
  }
  if (usuario?.id) { sets.push('cargado_por_id = ?'); valores.push(usuario.id); }

  valores.push(juego_id);
  await conn.execute(`UPDATE juegos SET ${sets.join(', ')} WHERE id = ?`, valores);
}

async function enTransaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await fn(conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Guarda TODO el bateo del juego (reemplaza lo anterior: las filas que se
// quitaron en pantalla se eliminan) y regenera bateo + fildeo pendientes.
async function guardarBateo(juego_id, lineas, usuario) {
  const limpias = combinarDuplicadas(
    lineas.map((l) => ({
      ...l,
      posicion: l.posicion || null,
      al: num(l.vb) + num(l.bb) + num(l.sh) + num(l.sf) + num(l.gp) + num(l.in_),
      ba: num(l.hc) + num(l.h2) + 2 * num(l.h3) + 3 * num(l.hr),
      tl: num(l.o) + num(l.a) + num(l.e),
      // PB / IR / OR solo aplican al receptor
      ...(l.posicion === 'C' ? {} : { pb: 0, ir: 0, or_c: 0 }),
    })),
    (l) => `${l.roster_id}|${l.posicion || ''}`,
    CAMPOS_BATEO,
  );

  await enTransaccion(async (conn) => {
    await conn.execute('DELETE FROM bateo_juego WHERE juego_id = ?', [juego_id]);
    await insertarFilas(conn, 'bateo_juego', CAMPOS_BATEO, juego_id, limpias);
    await sincronizarBateoYFildeo(conn, juego_id);
    await actualizarResultadoDesdeBoxscore(conn, juego_id, usuario);
  });
  return obtenerBateoPorJuego(juego_id);
}

async function guardarPitcheo(juego_id, lineas, usuario) {
  const limpias = combinarDuplicadas(lineas, (l) => String(l.roster_id), CAMPOS_PITCHEO);

  await enTransaccion(async (conn) => {
    await conn.execute('DELETE FROM pitcheo_juego WHERE juego_id = ?', [juego_id]);
    await insertarFilas(conn, 'pitcheo_juego', CAMPOS_PITCHEO, juego_id, limpias);
    await sincronizarPitcheo(conn, juego_id);
    await actualizarResultadoDesdeBoxscore(conn, juego_id, usuario);
  });
  return obtenerPitcheoPorJuego(juego_id);
}

// Lo usa juegosService al guardar la línea de anotación (entradas)
async function actualizarResultado(juego_id, usuario) {
  await enTransaccion((conn) => actualizarResultadoDesdeBoxscore(conn, juego_id, usuario));
}

async function eliminarBateo(id) {
  await pool.execute('DELETE FROM bateo_juego WHERE id = ?', [id]);
}

async function eliminarPitcheo(id) {
  await pool.execute('DELETE FROM pitcheo_juego WHERE id = ?', [id]);
}

async function juegoLlevaPitcheo(juego_id) {
  const [rows] = await pool.execute(
    `SELECT c.lleva_pitcheo
     FROM juegos j
     JOIN temporada_categoria tc ON tc.id = j.temporada_categoria_id
     JOIN categorias c ON c.id = tc.categoria_id
     WHERE j.id = ?`,
    [juego_id]
  );
  return rows[0] ? !!rows[0].lleva_pitcheo : false;
}

module.exports = {
  CAMPOS_BATEO, CAMPOS_PITCHEO, POSICIONES_FILDEO,
  obtenerBateoPorJuego, obtenerPitcheoPorJuego,
  guardarBateo, guardarPitcheo, actualizarResultado,
  eliminarBateo, eliminarPitcheo,
  juegoLlevaPitcheo,
};
