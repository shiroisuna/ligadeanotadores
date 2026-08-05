const temporadasModel = require('../models/temporadasModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

async function listar() {
  return temporadasModel.listar();
}

async function obtener(id) {
  const temporada = await temporadasModel.obtenerPorId(id);
  if (!temporada) throw noEncontrado('Temporada no encontrada');
  return temporada;
}

async function crear(datos) {
  if (!datos.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  return temporadasModel.crear(datos);
}

async function actualizar(id, datos) {
  await obtener(id);
  return temporadasModel.actualizar(id, datos);
}

async function eliminar(id) {
  await obtener(id);
  return temporadasModel.eliminar(id);
}

// ---- temporada_categoria ----

async function listarCategoriasDeTemporada(temporada_id) {
  if (!temporada_id) {
    const err = new Error('temporada_id es requerido');
    err.status = 400;
    throw err;
  }
  return temporadasModel.listarCategoriasDeTemporada(temporada_id);
}

async function crearCruce(datos) {
  if (!datos.temporada_id || !datos.categoria_id) {
    const err = new Error('temporada_id y categoria_id son requeridos');
    err.status = 400;
    throw err;
  }
  return temporadasModel.crearCruce(datos);
}

async function obtenerCruce(id) {
  const cruce = await temporadasModel.obtenerCruzePorId(id);
  if (!cruce) throw noEncontrado('Esta categoría no está activada en esa temporada');
  return cruce;
}

async function actualizarCruce(id, datos) {
  await obtenerCruce(id);
  return temporadasModel.actualizarCruce(id, datos);
}

async function eliminarCruce(id) {
  await obtenerCruce(id);
  return temporadasModel.eliminarCruce(id);
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarCategoriasDeTemporada, crearCruce, obtenerCruce, actualizarCruce, eliminarCruce,
};
