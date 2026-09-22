const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function listarAnotadores() {
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.activo, u.equipo_inscrito_id,
            eq.nombre AS equipo, c.nombre AS categoria_nombre
     FROM usuarios u
     LEFT JOIN equipos_inscritos ei ON ei.id = u.equipo_inscrito_id
     LEFT JOIN equipos eq ON eq.id = ei.equipo_id
     LEFT JOIN temporada_categoria tc ON tc.id = ei.temporada_categoria_id
     LEFT JOIN categorias c ON c.id = tc.categoria_id
     WHERE u.rol = 'anotador'
     ORDER BY u.activo DESC, eq.nombre`
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT id, email, rol, activo, equipo_inscrito_id FROM usuarios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crearAnotador({ email, password, equipo_inscrito_id }) {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    `INSERT INTO usuarios (email, password_hash, rol, equipo_inscrito_id, activo)
     VALUES (?, ?, 'anotador', ?, 1)`,
    [email, hash, equipo_inscrito_id]
  );
  return obtenerPorId(result.insertId);
}

async function actualizarEquipo(id, equipo_inscrito_id) {
  await pool.execute('UPDATE usuarios SET equipo_inscrito_id = ? WHERE id = ?', [equipo_inscrito_id, id]);
  return obtenerPorId(id);
}

async function cambiarPassword(id, password) {
  const hash = await bcrypt.hash(password, 10);
  await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, id]);
  return obtenerPorId(id);
}

// Baja lógica — igual que hace authModel.buscarPorEmail (WHERE activo = TRUE)
async function desactivar(id) {
  await pool.execute('UPDATE usuarios SET activo = 0 WHERE id = ?', [id]);
}

async function reactivar(id) {
  await pool.execute('UPDATE usuarios SET activo = 1 WHERE id = ?', [id]);
}

async function buscarPorEmailIncluyendoInactivos(email) {
  const [rows] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
}

module.exports = {
  listarAnotadores, obtenerPorId, crearAnotador,
  actualizarEquipo, cambiarPassword, desactivar, reactivar,
  buscarPorEmailIncluyendoInactivos,
};