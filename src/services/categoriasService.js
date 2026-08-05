const categoriasModel = require('../models/categoriasModel');

async function listar() {
  return categoriasModel.listar();
}

async function obtener(id) {
  const categoria = await categoriasModel.obtenerPorId(id);
  if (!categoria) {
    const err = new Error('Categoría no encontrada');
    err.status = 404;
    throw err;
  }
  return categoria;
}

async function crear(datos) {
  if (!datos.nombre || !datos.disciplina_id) {
    const err = new Error('nombre y disciplina_id son requeridos');
    err.status = 400;
    throw err;
  }
  return categoriasModel.crear(datos);
}

async function actualizar(id, datos) {
  await obtener(id); // valida que exista
  return categoriasModel.actualizar(id, datos);
}

async function eliminar(id) {
  await obtener(id);
  return categoriasModel.eliminar(id);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
