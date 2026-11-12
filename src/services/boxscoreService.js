const boxscoreModel = require('../models/boxscoreModel');
const juegosModel = require('../models/juegosModel');
const { validarAnotadorJuego } = require('./permisosJuegoService');

// Con equipo_inscrito_id la lista reemplaza todo lo del equipo, así que puede venir vacía (limpiar).
function validarLineas(lineas, equipo_inscrito_id) {
  if (!Array.isArray(lineas) || (!lineas.length && !equipo_inscrito_id)) {
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

// Verifica que el equipo sea uno de los dos del juego y que cada jugador sea de ese equipo.
async function validarEquipo(juego_id, lineas, equipo_inscrito_id) {
  if (!equipo_inscrito_id) return;
  const juego = await juegosModel.obtenerPorId(juego_id);
  const eq = Number(equipo_inscrito_id);
  if (![Number(juego.equipo_local_id), Number(juego.equipo_visitante_id)].includes(eq)) {
    const err = new Error('El equipo no participa en este juego');
    err.status = 400;
    throw err;
  }
  const delEquipo = new Set(await boxscoreModel.rosterIdsDeEquipo(eq));
  if (lineas.some((l) => !delEquipo.has(Number(l.roster_id)))) {
    const err = new Error('Hay jugadores que no pertenecen al equipo que se está guardando');
    err.status = 400;
    throw err;
  }
}

async function guardarBateo(juego_id, lineas, usuario, equipo_inscrito_id) {
  validarLineas(lineas, equipo_inscrito_id);
  await permiso(juego_id, usuario);
  await validarEquipo(juego_id, lineas, equipo_inscrito_id);
  return boxscoreModel.guardarBateo(juego_id, lineas, equipo_inscrito_id);
}

async function guardarPitcheo(juego_id, lineas, usuario, equipo_inscrito_id) {
  validarLineas(lineas, equipo_inscrito_id);
  await permiso(juego_id, usuario);
  const llevaPitcheo = await boxscoreModel.juegoLlevaPitcheo(juego_id);
  if (!llevaPitcheo) {
    const err = new Error('La categoría de este juego no lleva estadística de pitcheo');
    err.status = 400;
    throw err;
  }
  await validarEquipo(juego_id, lineas, equipo_inscrito_id);
  return boxscoreModel.guardarPitcheo(juego_id, lineas, equipo_inscrito_id);
}

async function eliminarBateo(id) {
  return boxscoreModel.eliminarBateo(id);
}

async function eliminarPitcheo(id) {
  return boxscoreModel.eliminarPitcheo(id);
}

module.exports = { obtenerBoxscore, obtenerBoxscorePublico, permiso, guardarBateo, guardarPitcheo, eliminarBateo, eliminarPitcheo };
