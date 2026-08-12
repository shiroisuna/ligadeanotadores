const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.query('SELECT * FROM fotos ORDER BY orden, id DESC');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM fotos WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ url, descripcion, juego_id, orden }) {
  const [result] = await pool.execute(
    'INSERT INTO fotos (url, descripcion, juego_id, orden) VALUES (?, ?, ?, ?)',
    [url, descripcion || null, juego_id || null, orden || 0]
  );
  return obtenerPorId(result.insertId);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM fotos WHERE id = ?', [id]);
}

module.exports = { listar, obtenerPorId, crear, eliminar };
