const usuariosModel = require('../models/usuariosModel');

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

async function listarAnotadores() {
  return usuariosModel.listarAnotadores();
}

async function crearAnotador({ email, password, equipo_inscrito_id }) {
  if (!validarEmail(email)) {
    const err = new Error('email inválido');
    err.status = 400;
    throw err;
  }
  if (!password || password.length < 6) {
    const err = new Error('password debe tener al menos 6 caracteres');
    err.status = 400;
    throw err;
  }
  if (!equipo_inscrito_id) {
    const err = new Error('equipo_inscrito_id es requerido — un anotador siempre debe quedar atado a un equipo');
    err.status = 400;
    throw err;
  }
  const existente = await usuariosModel.buscarPorEmailIncluyendoInactivos(email);
  if (existente) {
    const err = new Error('Ya existe un usuario con ese email');
    err.status = 409;
    throw err;
  }
  return usuariosModel.crearAnotador({ email, password, equipo_inscrito_id });
}

async function actualizarEquipo(id, equipo_inscrito_id) {
  if (!equipo_inscrito_id) {
    const err = new Error('equipo_inscrito_id es requerido');
    err.status = 400;
    throw err;
  }
  return usuariosModel.actualizarEquipo(id, equipo_inscrito_id);
}

async function cambiarPassword(id, password) {
  if (!password || password.length < 6) {
    const err = new Error('password debe tener al menos 6 caracteres');
    err.status = 400;
    throw err;
  }
  return usuariosModel.cambiarPassword(id, password);
}

async function desactivar(id) {
  return usuariosModel.desactivar(id);
}

async function reactivar(id) {
  return usuariosModel.reactivar(id);
}

module.exports = { listarAnotadores, crearAnotador, actualizarEquipo, cambiarPassword, desactivar, reactivar };