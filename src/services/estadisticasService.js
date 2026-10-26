const estBateoModel   = require('../models/estBateoModel');
const estPitcheoModel = require('../models/estPitcheoModel');
const estFildeoModel  = require('../models/estFildeoModel');
const estColectivoModel = require('../models/estColectivoModel');
const juegosModel     = require('../models/juegosModel');
const jugadoresModel  = require('../models/jugadoresModel');

function validarLineas(lineas) {
  if (!Array.isArray(lineas) || !lineas.length) {
    const err = new Error('lineas debe ser un arreglo con al menos un elemento');
    err.status = 400;
    throw err;
  }
  for (const l of lineas) {
    if (!l.roster_id) {
      const err = new Error('Cada línea necesita roster_id');
      err.status = 400;
      throw err;
    }
  }
}

// Si quien guarda es un anotador (no administrador), solo puede corregir
// las estadísticas del juego que tiene asignado.
async function validarPermisoAnotador(juego_id, usuario) {
  if (!usuario || usuario.rol !== 'anotador') return; // el admin no tiene restricción
  const juego = await juegosModel.obtenerPorId(juego_id);
  if (!juego || Number(juego.anotador_id) !== Number(usuario.id)) {
    const err = new Error('Este juego no está asignado a tu usuario de anotador');
    err.status = 403;
    throw err;
  }
}

async function obtenerEstadisticas(juego_id) {
  const [bateo, pitcheo, fildeo] = await Promise.all([
    estBateoModel.obtenerPorJuego(juego_id),
    estPitcheoModel.obtenerPorJuego(juego_id),
    estFildeoModel.obtenerPorJuego(juego_id),
  ]);
  return { bateo, pitcheo, fildeo };
}

async function guardarBateo(juego_id, lineas, usuario) {
  validarLineas(lineas);
  await validarPermisoAnotador(juego_id, usuario);
  return estBateoModel.guardar(juego_id, lineas);
}

async function guardarPitcheo(juego_id, lineas, usuario) {
  validarLineas(lineas);
  await validarPermisoAnotador(juego_id, usuario);
  const juegoData = await juegosModel.obtenerPorId(juego_id);
  if (!juegoData) {
    const err = new Error('Juego no encontrado');
    err.status = 404;
    throw err;
  }
  return estPitcheoModel.guardar(juego_id, lineas);
}

async function guardarFildeo(juego_id, lineas, usuario) {
  validarLineas(lineas);
  await validarPermisoAnotador(juego_id, usuario);
  for (const l of lineas) {
    if (!l.posicion) {
      const err = new Error('Cada línea de fildeo necesita posicion');
      err.status = 400;
      throw err;
    }
  }
  return estFildeoModel.guardar(juego_id, lineas);
}

async function obtenerColectivo(equipo_inscrito_id) {
  if (!equipo_inscrito_id) {
    const err = new Error('equipo_inscrito_id es requerido');
    err.status = 400;
    throw err;
  }
  return estColectivoModel.obtenerColectivo(equipo_inscrito_id);
}

async function obtenerColectivoPorCategoria(temporada_categoria_id) {
  if (!temporada_categoria_id) {
    const err = new Error('temporada_categoria_id es requerido');
    err.status = 400;
    throw err;
  }
  return estColectivoModel.obtenerColectivoPorCategoria(temporada_categoria_id);
}

module.exports = {
  obtenerEstadisticas,
  guardarBateo, guardarPitcheo, guardarFildeo,
  obtenerColectivo, obtenerColectivoPorCategoria,
};