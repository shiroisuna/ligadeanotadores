const anotadoresOficialesModel = require('../models/anotadoresOficialesModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

function validar({ nombres, apellidos }) {
  if (!nombres || !apellidos) {
    const err = new Error('nombres y apellidos son requeridos');
    err.status = 400;
    throw err;
  }
}

async function listar() {
  return anotadoresOficialesModel.listar();
}

async function crear(datos) {
  validar(datos);
  return anotadoresOficialesModel.crear(datos);
}

async function actualizar(id, datos) {
  validar(datos);
  const existente = await anotadoresOficialesModel.obtenerPorId(id);
  if (!existente) throw noEncontrado('Anotador oficial no encontrado');
  return anotadoresOficialesModel.actualizar(id, datos);
}

async function desactivar(id) {
  const existente = await anotadoresOficialesModel.obtenerPorId(id);
  if (!existente) throw noEncontrado('Anotador oficial no encontrado');
  return anotadoresOficialesModel.desactivar(id);
}

async function listarPorJuego(juego_id) {
  if (!juego_id) {
    const err = new Error('juego_id es requerido');
    err.status = 400;
    throw err;
  }
  return anotadoresOficialesModel.listarPorJuego(juego_id);
}

async function guardarPorJuego(juego_id, anotadores) {
  if (!juego_id) {
    const err = new Error('juego_id es requerido');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(anotadores)) {
    const err = new Error('anotadores debe ser un arreglo');
    err.status = 400;
    throw err;
  }
  for (const a of anotadores) {
    if (!a.anotador_id) {
      const err = new Error('Cada anotador oficial necesita anotador_id');
      err.status = 400;
      throw err;
    }
  }
  return anotadoresOficialesModel.guardarPorJuego(juego_id, anotadores);
}

module.exports = { listar, crear, actualizar, desactivar, listarPorJuego, guardarPorJuego };
