const boxscoreModel = require('../models/boxscoreModel');
const juegosModel = require('../models/juegosModel');
const { validarAnotadorJuego } = require('./permisosJuegoService');

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

// Vista pública: si el resultado del juego aún no fue aprobado por el
// administrador, no se publica el box score.
async function obtenerBoxscorePublico(juego_id) {
  const juego = await juegosModel.obtenerPorId(juego_id);
  if (!juego || !Number(juego.resultado_aprobado)) return { bateo: [], pitcheo: [], pendiente: true };
  return { ...(await obtenerBoxscore(juego_id)), pendiente: false };
}

async function permiso(juego_id, usuario) {
  const juego = await juegosModel.obtenerPorId(juego_id);
  if (!juego) { const e = new Error('Juego no encontrado'); e.status = 404; throw e; }
  await validarAnotadorJuego(juego, usuario);
}

async function obtenerBoxscore(juego_id) {
  const [bateo, pitcheo] = await Promise.all([
    boxscoreModel.obtenerBateoPorJuego(juego_id),
    boxscoreModel.obtenerPitcheoPorJuego(juego_id),
  ]);
  return { bateo, pitcheo };
}

async function guardarBateo(juego_id, lineas, usuario) {
  validarLineas(lineas);
  await permiso(juego_id, usuario);
  return boxscoreModel.guardarBateo(juego_id, lineas);
}

async function guardarPitcheo(juego_id, lineas, usuario) {
  validarLineas(lineas);
  await permiso(juego_id, usuario);
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

module.exports = { obtenerBoxscore, obtenerBoxscorePublico, permiso, guardarBateo, guardarPitcheo, eliminarBateo, eliminarPitcheo };
