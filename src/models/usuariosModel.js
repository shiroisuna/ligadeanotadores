const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const SELECT_USUARIO = `
  SELECT u.id, u.email, u.rol, u.activo, u.equipo_inscrito_id, u.creado_en,
         eq.nombre AS equipo, c.nombre AS categoria_nombre
  FROM usuarios u
  LEFT JOIN equipos_inscritos ei ON ei.id = u.equipo_inscrito_id
  LEFT JOIN equipos eq ON eq.id = ei.equipo_id
  LEFT JOIN temporada_categoria tc ON tc.id = ei.temporada_categoria_id
  LEFT JOIN categorias c ON c.id = tc.categoria_id`;

// ── Gestión general de usuarios (administrador) ─────────────────────────
async function listarTodos() {
  const [rows] = await pool.execute(
    `${SELECT_USUARIO} ORDER BY u.activo DESC, FIELD(u.rol,'administrador','anotador','jugador'), u.email`
  );
  return rows;
}

async function obtenerDetalle(id) {
  const [rows] = await pool.execute(`${SELECT_USUARIO} WHERE u.id = ?`, [id]);
  return rows[0] || null;
}

async function crear({ email, password, rol, equipo_inscrito_id }) {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    `INSERT INTO usuarios (email, password_hash, rol, equipo_inscrito_id, activo)
     VALUES (?, ?, ?, ?, 1)`,
    [email, hash, rol, rol === 'anotador' ? equipo_inscrito_id : null]
  );
  return obtenerDetalle(result.insertId);
}

async function actualizar(id, { email, rol, equipo_inscrito_id }) {
  await pool.execute(
    `UPDATE usuarios SET email = ?, rol = ?, equipo_inscrito_id = ? WHERE id = ?`,
    [email, rol, rol === 'anotador' ? equipo_inscrito_id : null, id]
  );
  return obtenerDetalle(id);
}

async function contarAdministradoresActivos(excluirId = null) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'administrador' AND activo = 1 AND id <> ?`,
    [excluirId ?? 0]
  );
  return Number(rows[0].n);
}

async function obtenerConHash(id) {
  const [rows] = await pool.execute('SELECT id, password_hash FROM usuarios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function buscarPorEmailIncluyendoInactivos(email) {
  const [rows] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
}

// ── Anotadores (se mantiene por compatibilidad con AnotadoresAdminPage) ─
async function listarAnotadores() {
  const [rows] = await pool.execute(
    `${SELECT_USUARIO} WHERE u.rol = 'anotador' ORDER BY u.activo DESC, eq.nombre`
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT id, email, rol, activo, equipo_inscrito_id FROM usuarios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crearAnotador({ email, password, equipo_inscrito_id }) {
  return crear({ email, password, rol: 'anotador', equipo_inscrito_id });
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
  return obtenerDetalle(id);
}

module.exports = {
  listarTodos, obtenerDetalle, crear, actualizar, contarAdministradoresActivos, obtenerConHash,
  listarAnotadores, obtenerPorId, crearAnotador,
  actualizarEquipo, cambiarPassword, desactivar, reactivar,
  buscarPorEmailIncluyendoInactivos,
};