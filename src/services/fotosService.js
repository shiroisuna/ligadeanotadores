const fotosModel = require('../models/fotosModel');

async function listar() {
  return fotosModel.listar();
}

async function crear(datos) {
  if (!datos.url) {
    const err = new Error('url es requerida');
    err.status = 400;
    throw err;
  }
  return fotosModel.crear(datos);
}

async function eliminar(id) {
  const foto = await fotosModel.obtenerPorId(id);
  if (!foto) {
    const err = new Error('Foto no encontrada');
    err.status = 404;
    throw err;
  }
  return fotosModel.eliminar(id);
}

module.exports = { listar, crear, eliminar };
