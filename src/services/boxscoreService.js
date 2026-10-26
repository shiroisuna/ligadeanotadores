const boxscoreModel = require('../models/boxscoreModel');
const juegosModel = require('../models/juegosModel');

function error(mensaje, status) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

function validarLineas(lineas) {
  if (!Array.isArray(lineas)) throw error('Se espera un arreglo de líneas', 400);
  for (const linea of lineas) {
    if (!linea.roster_id) throw error('Cada línea del box score necesita un jugador', 400);
  }
}

// El anotador solo puede llenar el box score del juego que tiene asignado
async function validarJuego(juego_id, usuario) {
  const juego = await juegosModel.obtenerPorId(juego_id);
  if (!juego) throw error('Juego no encontrado', 404);
  if (usuario?.rol === 'anotador' && Number(juego.anotador_id) !== Number(usuario.id)) {
    throw error('Este juego no está asignado a tu usuario de anotador', 403);
  }
  return juego;
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
  await validarJuego(juego_id, usuario);
  return boxscoreModel.guardarBateo(juego_id, lineas, usuario);
}

async function guardarPitcheo(juego_id, lineas, usuario) {
  validarLineas(lineas);
  await validarJuego(juego_id, usuario);
  if (lineas.length && !(await boxscoreModel.juegoLlevaPitcheo(juego_id))) {
    throw error('La categoría de este juego no lleva estadística de pitcheo', 400);
  }
  return boxscoreModel.guardarPitcheo(juego_id, lineas, usuario);
}

async function eliminarBateo(id) {
  return boxscoreModel.eliminarBateo(id);
}

async function eliminarPitcheo(id) {
  return boxscoreModel.eliminarPitcheo(id);
}

module.exports = { obtenerBoxscore, guardarBateo, guardarPitcheo, eliminarBateo, eliminarPitcheo };
