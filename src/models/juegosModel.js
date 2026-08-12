const pool = require('../config/db');

async function listar({ temporada_categoria_id, equipo_inscrito_id, estado }) {
  const condiciones = [];
  const valores = [];

  if (temporada_categoria_id) { condiciones.push('j.temporada_categoria_id = ?'); valores.push(temporada_categoria_id); }
  if (equipo_inscrito_id) { condiciones.push('(j.equipo_local_id = ? OR j.equipo_visitante_id = ?)'); valores.push(equipo_inscrito_id, equipo_inscrito_id); }
  if (estado) { condiciones.push('j.estado = ?'); valores.push(estado); }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT j.*, el.id AS local_equipo_inscrito_id, elq.nombre AS equipo_local, el.grupo AS grupo_local, elq.logo_url AS logo_local,
            ev.id AS visitante_equipo_inscrito_id, evq.nombre AS equipo_visitante, ev.grupo AS grupo_visitante, evq.logo_url AS logo_visitante,
            es.nombre AS estadio, egq.nombre AS equipo_ganador
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
    `SELECT j.*, elq.nombre AS equipo_local, evq.nombre AS equipo_visitante, es.nombre AS estadio
     FROM juegos j
     JOIN equipos_inscritos el ON el.id = j.equipo_local_id
     JOIN equipos elq ON elq.id = el.equipo_id
     JOIN equipos_inscritos ev ON ev.id = j.equipo_visitante_id
     JOIN equipos evq ON evq.id = ev.equipo_id
     LEFT JOIN estadios es ON es.id = j.estadio_id
     WHERE j.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function crear(datos) {
  const {
    temporada_categoria_id, equipo_local_id, equipo_visitante_id,
    fecha, hora, estadio_id,
  } = datos;
  const [result] = await pool.execute(
    `INSERT INTO juegos (temporada_categoria_id, equipo_local_id, equipo_visitante_id, fecha, hora, estadio_id, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'programado')`,
    [temporada_categoria_id, equipo_local_id, equipo_visitante_id, fecha, hora || null, estadio_id || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, datos) {
  const campos = [
    'fecha', 'hora', 'estadio_id', 'estado', 'carreras_local', 'carreras_visitante',
    'hits_local', 'hits_visitante', 'errores_local', 'errores_visitante',
    'arbitros', 'anotador_oficial', 'mvp_roster_id', 'tiempo_juego', 'observacion',
    'equipo_ganador_id',
  ];
  const sets = [];
  const valores = [];
  for (const campo of campos) {
    if (datos[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      valores.push(datos[campo]);
    }
  }
  if (!sets.length) return obtenerPorId(id);

  valores.push(id);
  await pool.execute(`UPDATE juegos SET ${sets.join(', ')} WHERE id = ?`, valores);
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM juegos WHERE id = ?', [id]);
}

// ---- entradas_juego ----

async function listarEntradas(juego_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM entradas_juego WHERE juego_id = ? ORDER BY numero_entrada',
    [juego_id]
  );
  return rows;
}

// Recibe un arreglo de { equipo_inscrito_id, numero_entrada, carreras } y
// hace upsert de cada una (gracias al UNIQUE KEY en juego_id+equipo+entrada).
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
  listar, obtenerPorId, crear, actualizar, eliminar,
  listarEntradas, guardarEntradas,
};
