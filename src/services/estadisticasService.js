const estBateoModel   = require('../models/estBateoModel');
const estPitcheoModel = require('../models/estPitcheoModel');
const estFildeoModel  = require('../models/estFildeoModel');
const juegosModel     = require('../models/juegosModel');

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

async function obtenerEstadisticas(juego_id) {
  const [bateo, pitcheo, fildeo] = await Promise.all([
    estBateoModel.obtenerPorJuego(juego_id),
    estPitcheoModel.obtenerPorJuego(juego_id),
    estFildeoModel.obtenerPorJuego(juego_id),
  ]);
  return { bateo, pitcheo, fildeo };
}

async function guardarBateo(juego_id, lineas) {
  validarLineas(lineas);
  return estBateoModel.guardar(juego_id, lineas);
}

async function guardarPitcheo(juego_id, lineas) {
  validarLineas(lineas);
  // Verificar que la categoría lleva pitcheo
  const juegoData = await juegosModel.obtenerPorId(juego_id);
  if (!juegoData) {
    const err = new Error('Juego no encontrado');
    err.status = 404;
    throw err;
  }
  return estPitcheoModel.guardar(juego_id, lineas);
}

async function guardarFildeo(juego_id, lineas) {
  validarLineas(lineas);
  for (const l of lineas) {
    if (!l.posicion) {
      const err = new Error('Cada línea de fildeo necesita posicion');
      err.status = 400;
      throw err;
    }
  }
  return estFildeoModel.guardar(juego_id, lineas);
}

module.exports = {
  obtenerEstadisticas,
  guardarBateo, guardarPitcheo, guardarFildeo,
};
