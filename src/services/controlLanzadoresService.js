const model = require('../models/controlLanzadoresModel');

async function listar(temporada_categoria_id) {
  if (!temporada_categoria_id) {
    const err = new Error('temporada_categoria_id es requerido');
    err.status = 400;
    throw err;
  }
  return model.listarPorTemporada(temporada_categoria_id);
}

async function registrar(datos) {
  const { roster_id, fecha, envios } = datos;
  // juego_id es opcional — el formulario permite "Sin vincular" y el
  // modelo ya lo maneja como juego_id || null en el INSERT.
  if (!roster_id || !fecha || envios === undefined) {
    const err = new Error('roster_id, fecha y envios son requeridos');
    err.status = 400;
    throw err;
  }
  return model.registrar(datos);
}

async function eliminar(id) {
  const reg = await model.obtenerPorId(id);
  if (!reg) {
    const err = new Error('Registro no encontrado');
    err.status = 404;
    throw err;
  }
  return model.eliminar(id);
}


async function listarReglas() { return model.listarReglas(); }

async function actualizarRegla(id, datos) {
  return model.actualizarRegla(id, datos);
}

module.exports = { listar, registrar, eliminar, listarReglas, actualizarRegla };