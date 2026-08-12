const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.query('SELECT * FROM disciplinas ORDER BY nombre');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM disciplinas WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombre }) {
  const [result] = await pool.execute('INSERT INTO disciplinas (nombre) VALUES (?)', [nombre]);
  return obtenerPorId(result.insertId);
}

module.exports = { listar, obtenerPorId, crear };
