const pool = require('../config/db');

// ---- equipos (catálogo general, sin importar la temporada) ----

async function listar() {
  const [rows] = await pool.query('SELECT * FROM equipos ORDER BY nombre');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM equipos WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombre, logo_url }) {
  const [result] = await pool.execute(
    'INSERT INTO equipos (nombre, logo_url) VALUES (?, ?)',
    [nombre, logo_url || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombre, logo_url }) {
  await pool.execute(
    'UPDATE equipos SET nombre = ?, logo_url = ? WHERE id = ?',
    [nombre, logo_url || null, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM equipos WHERE id = ?', [id]);
}

// ---- equipos_inscritos (el equipo dentro de una temporada+categoría, con su grupo) ----

async function listarInscritos(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT ei.id, ei.grupo, ei.temporada_categoria_id, e.id AS equipo_id, e.nombre, e.logo_url
     FROM equipos_inscritos ei
     JOIN equipos e ON e.id = ei.equipo_id
     WHERE ei.temporada_categoria_id = ?
     ORDER BY ei.grupo, e.nombre`,
    [temporada_categoria_id]
  );
  return rows;
}

async function obtenerInscripcionPorId(id) {
  const [rows] = await pool.execute(
    `SELECT ei.*, e.nombre AS equipo_nombre
     FROM equipos_inscritos ei
     JOIN equipos e ON e.id = ei.equipo_id
     WHERE ei.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function inscribir({ equipo_id, temporada_categoria_id, grupo }) {
  const [result] = await pool.execute(
    'INSERT INTO equipos_inscritos (equipo_id, temporada_categoria_id, grupo) VALUES (?, ?, ?)',
    [equipo_id, temporada_categoria_id, grupo || null]
  );
  return obtenerInscripcionPorId(result.insertId);
}

async function actualizarInscripcion(id, { grupo }) {
  await pool.execute('UPDATE equipos_inscritos SET grupo = ? WHERE id = ?', [grupo || null, id]);
  return obtenerInscripcionPorId(id);
}

async function eliminarInscripcion(id) {
  await pool.execute('DELETE FROM equipos_inscritos WHERE id = ?', [id]);
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, eliminar,
  listarInscritos, obtenerInscripcionPorId, inscribir, actualizarInscripcion, eliminarInscripcion,
};
