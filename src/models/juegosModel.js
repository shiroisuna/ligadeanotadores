const pool = require('../config/db');

async function listar({ temporada_categoria_id, equipo_inscrito_id, estado, fase }) {
  const condiciones = [];
  const valores = [];

  if (temporada_categoria_id) { condiciones.push('j.temporada_categoria_id = ?'); valores.push(temporada_categoria_id); }
  if (equipo_inscrito_id) { condiciones.push('(j.equipo_local_id = ? OR j.equipo_visitante_id = ?)'); valores.push(equipo_inscrito_id, equipo_inscrito_id); }
  if (estado) { condiciones.push('j.estado = ?'); valores.push(estado); }
  if (fase) { condiciones.push('j.fase = ?'); valores.push(fase); }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT j.*, el.id AS local_equipo_inscrito_id, elq.nombre AS equipo_local, el.grupo AS grupo_local, elq.logo_url AS logo_local,
            ev.id AS visitante_equipo_inscrito_id, evq.nombre AS equipo_visitante, ev.grupo AS grupo_visitante, evq.logo_url AS logo_visitante,
            es.nombre AS estadio, es.direccion AS estadio_direccion, egq.nombre AS equipo_ganador
     FROM juegos j
     JOIN equipos_inscritos el ON el.id = j.equipo_local_id
     JOIN equipos elq ON elq.id = el.equipo_id
     JOIN equipos_inscritos ev ON ev.id = j.equipo_visitante_id
     JOIN equipos evq ON evq.id = ev.equipo_id
     LEFT JOIN estadios es ON es.id = j.estadio_id
     LEFT JOIN equipos_inscritos eg ON eg.id = j.equipo_ganador_id
     LEFT JOIN equipos egq ON egq.id = eg.equipo_id
     ${where}
     ORDER BY j.fecha DESC, j.hora DESC`,
    valores
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute(
    `SELECT j.*, el.id AS local_equipo_inscrito_id, ev.id AS visitante_equipo_inscrito_id,
            elq.nombre AS equipo_local, elq.logo_url AS logo_local,
            evq.nombre AS equipo_visitante, evq.logo_url AS logo_visitante,
            es.nombre AS estadio, es.direccion AS estadio_direccion,
            c.nombre AS categoria_nombre, c.lleva_defensiva, c.lleva_pitcheo,
            CONCAT(jm.nombres, ' ', jm.apellidos) AS mvp_nombre,
            rm.equipo_inscrito_id AS mvp_equipo_inscrito_id
     FROM juegos j
     JOIN equipos_inscritos el ON el.id = j.equipo_local_id
     JOIN equipos elq ON elq.id = el.equipo_id
     JOIN equipos_inscritos ev ON ev.id = j.equipo_visitante_id
     JOIN equipos evq ON evq.id = ev.equipo_id
     LEFT JOIN estadios es ON es.id = j.estadio_id
     LEFT JOIN temporada_categoria tc ON tc.id = j.temporada_categoria_id
     LEFT JOIN categorias c ON c.id = tc.categoria_id
     LEFT JOIN roster rm ON rm.id = j.mvp_roster_id
     LEFT JOIN jugadores jm ON jm.id = rm.jugador_id
     WHERE j.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function crear(datos) {
  const {
    temporada_categoria_id, equipo_local_id, equipo_visitante_id,
    fecha, hora, estadio_id, fase,
  } = datos;
  const [result] = await pool.execute(
    `INSERT INTO juegos (temporada_categoria_id, equipo_local_id, equipo_visitante_id, fecha, hora, estadio_id, estado, fase)
     VALUES (?, ?, ?, ?, ?, ?, 'programado', ?)`,
    [temporada_categoria_id, equipo_local_id, equipo_visitante_id, fecha, hora || null, estadio_id || null, fase || 'eliminatoria']
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, datos) {
  const campos = [
    'fecha', 'fecha_fin', 'hora', 'hora_inicio', 'hora_final', 'duracion_minutos',
    'estadio_id', 'estado', 'ronda', 'entidad_arbitros', 'entidad_anotador',
    'carreras_local', 'carreras_visitante',
    'hits_local', 'hits_visitante', 'errores_local', 'errores_visitante',
    'arbitros', 'anotador_oficial', 'mvp_roster_id', 'tiempo_juego', 'observacion',
    'equipo_ganador_id',
    'io_local', 'id_local', 'io_visitante', 'id_visitante', 'qb_local', 'qb_visitante',
    'equipo_local_id', 'equipo_visitante_id', 'fase',
  ];
  const sets = [];
  const valores = [];
  for (const campo of campos) {
    if (datos[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      valores.push(datos[campo] === '' ? null : datos[campo]);
    }
  }
  if (!sets.length) return obtenerPorId(id);

  valores.push(id);
  await pool.execute(`UPDATE juegos SET ${sets.join(', ')} WHERE id = ?`, valores);
  return obtenerPorId(id);
}

// Tablas que cuelgan de un juego. Se borran primero; si alguna no existe en tu base
// (ER_NO_SUCH_TABLE) se ignora, así funciona igual en local y en el servidor.
const TABLAS_DEL_JUEGO = [
  'bateo_juego', 'pitcheo_juego', 'est_bateo', 'est_pitcheo', 'est_fildeo',
  'entradas_juego', 'incidencias', 'juego_arbitros', 'juego_anotadores_oficiales', 'anotador_juegos',
];

// Cuántos datos cargados tiene el juego (para avisar antes de borrar o cambiar equipos).
async function contarDatos(id) {
  const conteo = {};
  for (const t of TABLAS_DEL_JUEGO) {
    try {
      const [rows] = await pool.execute(`SELECT COUNT(*) AS n FROM ${t} WHERE juego_id = ?`, [id]);
      conteo[t] = Number(rows[0].n);
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    }
  }
  return conteo;
}

// Intercambia local <-> visitante conservando todo el resultado: equipos y todos los datos "por lado".
// (Se hace leyendo y escribiendo valores explícitos: un UPDATE a=b, b=a se evalúa de izquierda a derecha.)
const PARES_LADO = [
  ['carreras_local', 'carreras_visitante'], ['hits_local', 'hits_visitante'],
  ['errores_local', 'errores_visitante'], ['io_local', 'io_visitante'],
  ['id_local', 'id_visitante'], ['qb_local', 'qb_visitante'],
];

async function intercambiarLados(id) {
  const [rows] = await pool.execute('SELECT * FROM juegos WHERE id = ?', [id]);
  const j = rows[0];
  const sets = ['equipo_local_id = ?', 'equipo_visitante_id = ?'];
  const valores = [j.equipo_visitante_id, j.equipo_local_id];
  for (const [a, b] of PARES_LADO) {
    if (a in j && b in j) { sets.push(`${a} = ?`, `${b} = ?`); valores.push(j[b], j[a]); }
  }
  valores.push(id);
  await pool.execute(`UPDATE juegos SET ${sets.join(', ')} WHERE id = ?`, valores);
}

// Cambio a OTROS equipos: borra box score, estadísticas, entradas e incidencias del juego y limpia el
// marcador. Conserva fecha, estadio, árbitros, anotadores asignados y la programación.
const TABLAS_DATOS = ['bateo_juego', 'pitcheo_juego', 'est_bateo', 'est_pitcheo', 'est_fildeo', 'entradas_juego', 'incidencias'];

async function limpiarDatosJuego(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const t of TABLAS_DATOS) {
      try { await conn.execute(`DELETE FROM ${t} WHERE juego_id = ?`, [id]); }
      catch (err) { if (err.code !== 'ER_NO_SUCH_TABLE') throw err; }
    }
    const nulos = ['carreras_local', 'carreras_visitante', 'hits_local', 'hits_visitante',
      'errores_local', 'errores_visitante', 'io_local', 'id_local', 'io_visitante', 'id_visitante',
      'qb_local', 'qb_visitante', 'equipo_ganador_id', 'mvp_roster_id'];
    try {
      await conn.execute(
        `UPDATE juegos SET ${nulos.map((c) => `${c} = NULL`).join(', ')}, resultado_aprobado = 0, estado = 'programado' WHERE id = ?`, [id]);
    } catch (err) {
      if (err.code !== 'ER_BAD_NULL_ERROR') throw err;
      // Si alguna columna no admite NULL, usar 0 en las numéricas del marcador
      const ceros = ['carreras_local', 'carreras_visitante', 'hits_local', 'hits_visitante', 'errores_local', 'errores_visitante'];
      const restantes = nulos.filter((c) => !ceros.includes(c));
      await conn.execute(
        `UPDATE juegos SET ${ceros.map((c) => `${c} = 0`).join(', ')}, ${restantes.map((c) => `${c} = NULL`).join(', ')}, resultado_aprobado = 0, estado = 'programado' WHERE id = ?`, [id]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function eliminar(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const t of TABLAS_DEL_JUEGO) {
      try {
        await conn.execute(`DELETE FROM ${t} WHERE juego_id = ?`, [id]);
      } catch (err) {
        if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
      }
    }
    await conn.execute('DELETE FROM juegos WHERE id = ?', [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ---- entradas_juego ----

async function listarEntradas(juego_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM entradas_juego WHERE juego_id = ? ORDER BY numero_entrada',
    [juego_id]
  );
  return rows;
}

async function guardarEntradas(juego_id, entradas) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const e of entradas) {
      await conn.execute(
        `INSERT INTO entradas_juego (juego_id, equipo_inscrito_id, numero_entrada, carreras)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE carreras = VALUES(carreras)`,
        [juego_id, e.equipo_inscrito_id, e.numero_entrada, e.carreras || 0]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return listarEntradas(juego_id);
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, eliminar, contarDatos, intercambiarLados, limpiarDatosJuego,
  listarEntradas, guardarEntradas,
};
