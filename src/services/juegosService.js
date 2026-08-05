const juegosModel = require('../models/juegosModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

async function listar(filtros) {
  return juegosModel.listar(filtros);
}

async function obtener(id) {
  const juego = await juegosModel.obtenerPorId(id);
  if (!juego) throw noEncontrado('Juego no encontrado');
  return juego;
}

async function crear(datos) {
  const requeridos = ['temporada_categoria_id', 'equipo_local_id', 'equipo_visitante_id', 'fecha'];
  for (const campo of requeridos) {
    if (!datos[campo]) {
      const err = new Error(`${campo} es requerido`);
      err.status = 400;
      throw err;
    }
  }
  if (datos.equipo_local_id === datos.equipo_visitante_id) {
    const err = new Error('El equipo local y visitante no pueden ser el mismo');
    err.status = 400;
    throw err;
  }
  return juegosModel.crear(datos);
}

async function actualizar(id, datos) {
  await obtener(id);
  return juegosModel.actualizar(id, datos);
}

async function eliminar(id) {
  await obtener(id);
  return juegosModel.eliminar(id);
}

// ---- entradas ----

async function listarEntradas(juego_id) {
  await obtener(juego_id);
  return juegosModel.listarEntradas(juego_id);
}

async function guardarEntradas(juego_id, entradas) {
  await obtener(juego_id);
  if (!Array.isArray(entradas) || !entradas.length) {
    const err = new Error('entradas debe ser un arreglo con al menos un elemento');
    err.status = 400;
    throw err;
  }
  return juegosModel.guardarEntradas(juego_id, entradas);
}

module.exports = { listar, obtener, crear, actualizar, eliminar, listarEntradas, guardarEntradas };
