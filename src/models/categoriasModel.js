const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.query(
    `SELECT c.*, d.nombre AS disciplina
     FROM categorias c
     JOIN disciplinas d ON d.id = c.disciplina_id
     ORDER BY c.orden_visual, c.nombre`
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute(
    `SELECT c.*, d.nombre AS disciplina
     FROM categorias c
     JOIN disciplinas d ON d.id = c.disciplina_id
     WHERE c.id = ?`, [id]
  );
  return rows[0] || null;
}

async function crear({ disciplina_id, nombre, lleva_pitcheo, nivel_standings, num_innings, orden_visual }) {
  const [res] = await pool.execute(
    `INSERT INTO categorias (disciplina_id, nombre, lleva_pitcheo, nivel_standings, num_innings, orden_visual)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [disciplina_id, nombre, lleva_pitcheo ? 1 : 0, nivel_standings || 'basico',
     num_innings || 7, orden_visual || 0]
  );
  return obtenerPorId(res.insertId);
}

async function actualizar(id, { disciplina_id, nombre, lleva_pitcheo, nivel_standings, num_innings, orden_visual }) {
  await pool.execute(
    `UPDATE categorias SET disciplina_id=?, nombre=?, lleva_pitcheo=?,
     nivel_standings=?, num_innings=?, orden_visual=? WHERE id=?`,
    [disciplina_id, nombre, lleva_pitcheo ? 1 : 0, nivel_standings || 'basico',
     num_innings || 7, orden_visual || 0, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM categorias WHERE id = ?', [id]);
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
