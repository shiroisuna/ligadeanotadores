const contenidoModel = require('../models/contenidoModel');

async function obtener() {
  return contenidoModel.obtener();
}

async function actualizar(datos) {
  return contenidoModel.actualizar(datos);
}

module.exports = { obtener, actualizar };
