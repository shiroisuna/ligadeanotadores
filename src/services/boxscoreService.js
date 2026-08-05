const boxscoreModel = require('../models/boxscoreModel');

function validarLineas(lineas) {
  if (!Array.isArray(lineas) || !lineas.length) {
    const err = new Error('Se espera un arreglo de líneas con al menos un elemento');
    err.status = 400;
    throw err;
  }
  for (const linea of lineas) {
    if (!linea.roster_id) {
      const err = new Error('Cada línea del box score necesita roster_id');
      err.status = 400;
      throw err;
    }
  }
}

async function obtenerBoxscore(juego_id) {
  const [bateo, pitcheo] = await Promise.all([
    boxscoreModel.obtenerBateoPorJuego(juego_id),
    boxscoreModel.obtenerPitcheoPorJuego(juego_id),
  ]);
  return { bateo, pitcheo };
}

async function guardarBateo(juego_id, lineas) {
  validarLineas(lineas);
  return boxscoreModel.guardarBateo(juego_id, lineas);
}

async function guardarPitcheo(juego_id, lineas) {
  validarLineas(lineas);
  const llevaPitcheo = await boxscoreModel.juegoLlevaPitcheo(juego_id);
  if (!llevaPitcheo) {
    const err = new Error('La categoría de este juego no lleva estadística de pitcheo');
    err.status = 400;
    throw err;
  }
  return boxscoreModel.guardarPitcheo(juego_id, lineas);
}

async function eliminarBateo(id) {
  return boxscoreModel.eliminarBateo(id);
}

async function eliminarPitcheo(id) {
  return boxscoreModel.eliminarPitcheo(id);
}

module.exports = { obtenerBoxscore, guardarBateo, guardarPitcheo, eliminarBateo, eliminarPitcheo };
