const arbitrosModel = require('../models/arbitrosModel');

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
  return arbitrosModel.listar();
}

async function crear(datos) {
  validar(datos);
  return arbitrosModel.crear(datos);
}

async function actualizar(id, datos) {
  validar(datos);
  const existente = await arbitrosModel.obtenerPorId(id);
  if (!existente) throw noEncontrado('Árbitro no encontrado');
  return arbitrosModel.actualizar(id, datos);
}

async function desactivar(id) {
  const existente = await arbitrosModel.obtenerPorId(id);
  if (!existente) throw noEncontrado('Árbitro no encontrado');
  return arbitrosModel.desactivar(id);
}

async function listarPorJuego(juego_id) {
  if (!juego_id) {
    const err = new Error('juego_id es requerido');
    err.status = 400;
    throw err;
  }
  return arbitrosModel.listarPorJuego(juego_id);
}

async function guardarPorJuego(juego_id, arbitros) {
  if (!juego_id) {
    const err = new Error('juego_id es requerido');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(arbitros)) {
    const err = new Error('arbitros debe ser un arreglo');
    err.status = 400;
    throw err;
  }
  for (const a of arbitros) {
    if (!a.arbitro_id) {
      const err = new Error('Cada árbitro necesita arbitro_id');
      err.status = 400;
      throw err;
    }
  }
  return arbitrosModel.guardarPorJuego(juego_id, arbitros);
}

module.exports = { listar, crear, actualizar, desactivar, listarPorJuego, guardarPorJuego };