const bcrypt = require('bcryptjs');
const usuariosModel = require('../models/usuariosModel');

const ROLES = ['administrador', 'anotador', 'jugador'];

function fallo(msg, status = 400) {
  const err = new Error(msg);
  err.status = status;
  return err;
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function validarPassword(password) {
  if (!password || password.length < 6) throw fallo('La contraseña debe tener al menos 6 caracteres');
}

// ── General ──────────────────────────────────────────────────────────────
async function listarTodos() {
  return usuariosModel.listarTodos();
}

async function crear({ email, password, rol, equipo_inscrito_id }) {
  email = (email || '').trim().toLowerCase();
  if (!validarEmail(email)) throw fallo('Correo inválido');
  validarPassword(password);
  if (!ROLES.includes(rol)) throw fallo(`Rol inválido. Usa: ${ROLES.join(', ')}`);
  if (rol === 'anotador' && !equipo_inscrito_id) {
    throw fallo('Un anotador debe quedar atado a un equipo');
  }
  if (await usuariosModel.buscarPorEmailIncluyendoInactivos(email)) {
    throw fallo('Ya existe un usuario con ese correo', 409);
  }
  return usuariosModel.crear({ email, password, rol, equipo_inscrito_id });
}

async function actualizar(id, { email, rol, equipo_inscrito_id }, quienEdita) {
  const actual = await usuariosModel.obtenerDetalle(id);
  if (!actual) throw fallo('Usuario no encontrado', 404);
  email = (email || '').trim().toLowerCase();
  if (!validarEmail(email)) throw fallo('Correo inválido');
  if (!ROLES.includes(rol)) throw fallo(`Rol inválido. Usa: ${ROLES.join(', ')}`);
  if (rol === 'anotador' && !equipo_inscrito_id) throw fallo('Un anotador debe quedar atado a un equipo');

  const otro = await usuariosModel.buscarPorEmailIncluyendoInactivos(email);
  if (otro && Number(otro.id) !== Number(id)) throw fallo('Ya existe un usuario con ese correo', 409);

  if (actual.rol === 'administrador' && rol !== 'administrador') {
    if (Number(quienEdita.id) === Number(id)) throw fallo('No puedes quitarte a ti mismo el rol de administrador');
    if ((await usuariosModel.contarAdministradoresActivos(id)) < 1) throw fallo('Debe quedar al menos un administrador activo');
  }
  return usuariosModel.actualizar(id, { email, rol, equipo_inscrito_id });
}

// Reset por el administrador: define una clave nueva para cualquier usuario.
async function resetPassword(id, password) {
  validarPassword(password);
  if (!(await usuariosModel.obtenerDetalle(id))) throw fallo('Usuario no encontrado', 404);
  await usuariosModel.cambiarPassword(id, password);
  return { ok: true };
}

async function desactivar(id, quienEdita) {
  const actual = await usuariosModel.obtenerDetalle(id);
  if (!actual) throw fallo('Usuario no encontrado', 404);
  if (Number(quienEdita.id) === Number(id)) throw fallo('No puedes desactivarte a ti mismo');
  if (actual.rol === 'administrador' && (await usuariosModel.contarAdministradoresActivos(id)) < 1) {
    throw fallo('Debe quedar al menos un administrador activo');
  }
  await usuariosModel.desactivar(id);
}

async function reactivar(id) {
  if (!(await usuariosModel.obtenerDetalle(id))) throw fallo('Usuario no encontrado', 404);
  return usuariosModel.reactivar(id);
}

// Cualquier usuario autenticado cambia su propia clave (pide la actual).
async function cambiarMiPassword(usuarioId, passwordActual, passwordNueva) {
  validarPassword(passwordNueva);
  const u = await usuariosModel.obtenerConHash(usuarioId);
  if (!u) throw fallo('Usuario no encontrado', 404);
  if (!(await bcrypt.compare(passwordActual || '', u.password_hash))) throw fallo('La contraseña actual no es correcta', 401);
  await usuariosModel.cambiarPassword(usuarioId, passwordNueva);
  return { ok: true };
}

// ── Compatibilidad con la pantalla de Anotadores ────────────────────────
async function listarAnotadores() { return usuariosModel.listarAnotadores(); }
async function crearAnotador(datos) { return crear({ ...datos, rol: 'anotador' }); }
async function actualizarEquipo(id, equipo_inscrito_id) {
  if (!equipo_inscrito_id) throw fallo('equipo_inscrito_id es requerido');
  return usuariosModel.actualizarEquipo(id, equipo_inscrito_id);
}

module.exports = {
  listarTodos, crear, actualizar, resetPassword, desactivar, reactivar, cambiarMiPassword,
  listarAnotadores, crearAnotador, actualizarEquipo,
  cambiarPassword: resetPassword,
};