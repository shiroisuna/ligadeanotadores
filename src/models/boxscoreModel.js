const pool = require('../config/db');

const CAMPOS_BATEO = [
  'posicion', 'vb', 'ca', 'hc', 'bb', 'sh', 'sf', 'gp', 'in_', 'al',
  'h2', 'h3', 'hr', 'ba', 'ci', 'br', 'or_', 'so', 'ij', 'o', 'a', 'e', 'tl', 'dp', 'di',
  // posición por entrada (1 a 9): P, C, 1B, 2B, 3B, SS, LF, CF, RF, SF, DH, BE, CE
  'pos_1', 'pos_2', 'pos_3', 'pos_4', 'pos_5', 'pos_6', 'pos_7', 'pos_8', 'pos_9',
];

// Orden del box score físico: I, R, C, G, P, S, E, T.L, VB, HP, H2, H3, HR, IL, CP, CL, SO, BB, BI, SF, GP, WP, BK
const CAMPOS_PITCHEO = [
  'i', 'r', 'c', 'g', 'p', 's', 'e', 'tl', 'vb_enfrentados', 'hp', 'h2', 'h3', 'hr', 'il',
  'cp', 'cl', 'so', 'bb', 'bi', 'sf', 'gp', 'wp', 'bk',
];

async function obtenerBateoPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT bj.*, j.nombres, j.apellidos, r.numero_camiseta, r.equipo_inscrito_id
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
    `SELECT pj.*, j.nombres, j.apellidos, j.lado, r.numero_camiseta, r.equipo_inscrito_id
     FROM pitcheo_juego pj
     JOIN roster r ON r.id = pj.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE pj.juego_id = ?
     ORDER BY pj.id`,
    [juego_id]
  );
  return rows;
}

function armarUpsert(tabla, campos, juego_id, linea) {
  const columnas = ['juego_id', 'roster_id', ...campos];
  const valores = [juego_id, linea.roster_id, ...campos.map((c) => linea[c] ?? (c === 'posicion' || c.startsWith('pos_') ? null : 0))];
  const placeholders = columnas.map(() => '?').join(', ');
  const actualizaciones = campos.map((c) => `${c} = VALUES(${c})`).join(', ');

  return {
    sql: `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${placeholders})
          ON DUPLICATE KEY UPDATE ${actualizaciones}`,
    valores,
  };
}

// Roster ids de un equipo inscrito (para validar que las líneas son de ese equipo)
async function rosterIdsDeEquipo(equipo_inscrito_id) {
  const [rows] = await pool.execute('SELECT id FROM roster WHERE equipo_inscrito_id = ?', [equipo_inscrito_id]);
  return rows.map((r) => Number(r.id));
}

// Borra las líneas del equipo que ya no vienen en la lista guardada (reemplazo por equipo).
async function borrarSobrantes(conn, tabla, juego_id, equipo_inscrito_id, lineas) {
  const ids = lineas.map((l) => Number(l.roster_id));
  let sql = `DELETE t FROM ${tabla} t JOIN roster r ON r.id = t.roster_id
             WHERE t.juego_id = ? AND r.equipo_inscrito_id = ?`;
  const params = [juego_id, equipo_inscrito_id];
  if (ids.length) {
    sql += ` AND t.roster_id NOT IN (${ids.map(() => '?').join(', ')})`;
    params.push(...ids);
  }
  await conn.execute(sql, params);
}

async function guardarBateo(juego_id, lineas, equipo_inscrito_id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (equipo_inscrito_id) await borrarSobrantes(conn, 'bateo_juego', juego_id, equipo_inscrito_id, lineas);
    for (const linea of lineas) {
      const { sql, valores } = armarUpsert('bateo_juego', CAMPOS_BATEO, juego_id, linea);
      await conn.execute(sql, valores);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return obtenerBateoPorJuego(juego_id);
}

async function guardarPitcheo(juego_id, lineas, equipo_inscrito_id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (equipo_inscrito_id) await borrarSobrantes(conn, 'pitcheo_juego', juego_id, equipo_inscrito_id, lineas);
    for (const linea of lineas) {
      const { sql, valores } = armarUpsert('pitcheo_juego', CAMPOS_PITCHEO, juego_id, linea);
      await conn.execute(sql, valores);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return obtenerPitcheoPorJuego(juego_id);
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
  CAMPOS_BATEO, CAMPOS_PITCHEO,
  obtenerBateoPorJuego, obtenerPitcheoPorJuego,
  guardarBateo, guardarPitcheo,
  eliminarBateo, eliminarPitcheo,
  juegoLlevaPitcheo, rosterIdsDeEquipo,
};
