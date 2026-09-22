const juegosModel = require('../models/juegosModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

function sinPermiso(mensaje) {
  const err = new Error(mensaje);
  err.status = 403;
  return err;
}

// Si quien actúa es anotador (no administrador), su equipo debe ser
// local o visitante en ESE juego — nunca puede tocar el resultado ni
// las entradas de un juego ajeno.
function validarPermisoAnotador(juego, usuario) {
  if (!usuario || usuario.rol !== 'anotador') return; // el admin no tiene restricción
  const suEquipo = usuario.equipo_inscrito_id;
  const esSuJuego = juego.equipo_local_id === suEquipo || juego.equipo_visitante_id === suEquipo;
  if (!esSuJuego) {
    throw sinPermiso('Solo puedes cargar el resultado de juegos de tu propio equipo');
  }
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

async function actualizar(id, datos, usuario) {
  const juego = await obtener(id);
  validarPermisoAnotador(juego, usuario);
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

async function guardarEntradas(juego_id, entradas, usuario) {
  const juego = await obtener(juego_id);
  validarPermisoAnotador(juego, usuario);
  if (!Array.isArray(entradas) || !entradas.length) {
    const err = new Error('entradas debe ser un arreglo con al menos un elemento');
    err.status = 400;
    throw err;
  }
  return juegosModel.guardarEntradas(juego_id, entradas);
}

module.exports = { listar, obtener, crear, actualizar, eliminar, listarEntradas, guardarEntradas };