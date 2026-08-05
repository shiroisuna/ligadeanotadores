const jugadoresModel = require('../models/jugadoresModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

async function listar() {
  return jugadoresModel.listar();
}

async function obtener(id) {
  const jugador = await jugadoresModel.obtenerPorId(id);
  if (!jugador) throw noEncontrado('Jugador no encontrado');
  return jugador;
}

async function crear(datos) {
  if (!datos.nombres || !datos.apellidos) {
    const err = new Error('nombres y apellidos son requeridos');
    err.status = 400;
    throw err;
  }
  return jugadoresModel.crear(datos);
}

async function actualizar(id, datos) {
  await obtener(id);
  return jugadoresModel.actualizar(id, datos);
}

async function eliminar(id) {
  await obtener(id);
  return jugadoresModel.eliminar(id);
}

// ---- roster ----

async function listarRosterPorEquipo(equipo_inscrito_id) {
  if (!equipo_inscrito_id) {
    const err = new Error('equipo_inscrito_id es requerido');
    err.status = 400;
    throw err;
  }
  return jugadoresModel.listarRosterPorEquipo(equipo_inscrito_id);
}

async function agregarARoster(datos) {
  if (!datos.jugador_id || !datos.equipo_inscrito_id) {
    const err = new Error('jugador_id y equipo_inscrito_id son requeridos');
    err.status = 400;
    throw err;
  }
  return jugadoresModel.agregarARoster(datos);
}

async function obtenerRoster(id) {
  const item = await jugadoresModel.obtenerRosterPorId(id);
  if (!item) throw noEncontrado('Registro de roster no encontrado');
  return item;
}

async function actualizarRoster(id, datos) {
  await obtenerRoster(id);
  return jugadoresModel.actualizarRoster(id, datos);
}

async function eliminarDeRoster(id) {
  await obtenerRoster(id);
  return jugadoresModel.eliminarDeRoster(id);
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarRosterPorEquipo, agregarARoster, obtenerRoster, actualizarRoster, eliminarDeRoster,
};
