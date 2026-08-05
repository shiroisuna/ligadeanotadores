const equiposModel = require('../models/equiposModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

async function listar() {
  return equiposModel.listar();
}

async function obtener(id) {
  const equipo = await equiposModel.obtenerPorId(id);
  if (!equipo) throw noEncontrado('Equipo no encontrado');
  return equipo;
}

async function crear(datos) {
  if (!datos.nombre) {
    const err = new Error('nombre es requerido');
    err.status = 400;
    throw err;
  }
  return equiposModel.crear(datos);
}

async function actualizar(id, datos) {
  await obtener(id);
  return equiposModel.actualizar(id, datos);
}

async function eliminar(id) {
  await obtener(id);
  return equiposModel.eliminar(id);
}

// ---- inscripciones ----

async function listarInscritos(temporada_categoria_id) {
  if (!temporada_categoria_id) {
    const err = new Error('temporada_categoria_id es requerido');
    err.status = 400;
    throw err;
  }
  return equiposModel.listarInscritos(temporada_categoria_id);
}

async function inscribir(datos) {
  if (!datos.equipo_id || !datos.temporada_categoria_id) {
    const err = new Error('equipo_id y temporada_categoria_id son requeridos');
    err.status = 400;
    throw err;
  }
  return equiposModel.inscribir(datos);
}

async function obtenerInscripcion(id) {
  const inscripcion = await equiposModel.obtenerInscripcionPorId(id);
  if (!inscripcion) throw noEncontrado('Inscripción no encontrada');
  return inscripcion;
}

async function actualizarInscripcion(id, datos) {
  await obtenerInscripcion(id);
  return equiposModel.actualizarInscripcion(id, datos);
}

async function eliminarInscripcion(id) {
  await obtenerInscripcion(id);
  return equiposModel.eliminarInscripcion(id);
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarInscritos, inscribir, obtenerInscripcion, actualizarInscripcion, eliminarInscripcion,
};
