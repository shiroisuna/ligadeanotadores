const disciplinasModel = require('../models/disciplinasModel');

async function listar() {
  return disciplinasModel.listar();
}

async function crear(datos) {
  if (!datos.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  return disciplinasModel.crear(datos);
}

module.exports = { listar, crear };
