const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.execute('SELECT * FROM estadios ORDER BY nombre');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM estadios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombre, direccion }) {
  const [result] = await pool.execute(
    'INSERT INTO estadios (nombre, direccion) VALUES (?, ?)',
    [nombre, direccion || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombre, direccion }) {
  await pool.execute(
    'UPDATE estadios SET nombre=?, direccion=? WHERE id=?',
    [nombre, direccion || null, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM estadios WHERE id = ?', [id]);
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };