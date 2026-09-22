// const pool = require('../config/db');

// async function listar() {
//   const [rows] = await pool.query('SELECT * FROM disciplinas ORDER BY nombre');
//   return rows;
// }

// async function obtenerPorId(id) {
//   const [rows] = await pool.execute('SELECT * FROM disciplinas WHERE id = ?', [id]);
//   return rows[0] || null;
// }

// async function crear({ nombre }) {
//   const [result] = await pool.execute('INSERT INTO disciplinas (nombre) VALUES (?)', [nombre]);
//   return obtenerPorId(result.insertId);
// }

// module.exports = { listar, obtenerPorId, crear };


const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.query('SELECT * FROM disciplinas ORDER BY nombre');
  return rows;
}

async function crear({ nombre }) {
  const [res] = await pool.execute('INSERT INTO disciplinas (nombre) VALUES (?)', [nombre]);
  const [rows] = await pool.execute('SELECT * FROM disciplinas WHERE id=?', [res.insertId]);
  return rows[0];
}

async function actualizar(id, { nombre }) {
  await pool.execute('UPDATE disciplinas SET nombre=? WHERE id=?', [nombre, id]);
  const [rows] = await pool.execute('SELECT * FROM disciplinas WHERE id=?', [id]);
  return rows[0];
}

async function eliminar(id) {
  await pool.execute('DELETE FROM disciplinas WHERE id=?', [id]);
}

module.exports = { listar, crear, actualizar, eliminar };