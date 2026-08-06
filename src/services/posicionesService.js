const posicionesModel = require('../models/posicionesModel');

async function obtener(temporada_categoria_id) {
  if (!temporada_categoria_id) {
    const err = new Error('temporada_categoria_id es requerido');
    err.status = 400;
    throw err;
  }
  return posicionesModel.obtener(temporada_categoria_id);
}

module.exports = { obtener };
