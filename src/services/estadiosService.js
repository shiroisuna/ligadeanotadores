const estadiosModel = require('../models/estadiosModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

async function listar() {
  return estadiosModel.listar();
}

async function crear(datos) {
  if (!datos.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  return estadiosModel.crear(datos);
}

async function actualizar(id, datos) {
  const existente = await estadiosModel.obtenerPorId(id);
  if (!existente) throw noEncontrado('Estadio no encontrado');
  if (!datos.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  return estadiosModel.actualizar(id, datos);
}

async function eliminar(id) {
  const existente = await estadiosModel.obtenerPorId(id);
  if (!existente) throw noEncontrado('Estadio no encontrado');
  return estadiosModel.eliminar(id);
}

module.exports = { listar, crear, actualizar, eliminar };