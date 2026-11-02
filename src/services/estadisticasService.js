const estBateoModel   = require('../models/estBateoModel');
const estPitcheoModel = require('../models/estPitcheoModel');
const estFildeoModel  = require('../models/estFildeoModel');
const estColectivoModel = require('../models/estColectivoModel');
const juegosModel     = require('../models/juegosModel');
const jugadoresModel  = require('../models/jugadoresModel');
const { validarAnotadorJuego } = require('./permisosJuegoService');

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

// Si quien guarda es un anotador: debe tener el juego asignado (o ser de su
// equipo) y las líneas solo pueden ser de jugadores de ESE juego. Si el juego
// no se le asignó, se mantiene la regla antigua: solo jugadores de su equipo.
async function validarPermisoAnotador(juego_id, lineas, usuario) {
  if (!usuario || usuario.rol !== 'anotador') return;
  const juego = await juegosModel.obtenerPorId(juego_id);
  if (!juego) { const e = new Error('Juego no encontrado'); e.status = 404; throw e; }
  const modo = await validarAnotadorJuego(juego, usuario);
  const mapa = await jugadoresModel.obtenerEquiposDeRoster(lineas.map((l) => l.roster_id));
  const equiposJuego = [Number(juego.equipo_local_id), Number(juego.equipo_visitante_id)];
  const ok = lineas.every((l) => modo === 'asignado'
    ? equiposJuego.includes(Number(mapa[l.roster_id]))
    : Number(mapa[l.roster_id]) === Number(usuario.equipo_inscrito_id));
  if (!ok) {
    const err = new Error('Hay jugadores que no pertenecen a este juego / a tu equipo');
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
  await validarPermisoAnotador(juego_id, lineas, usuario);
  return estBateoModel.guardar(juego_id, lineas);
}

async function guardarPitcheo(juego_id, lineas, usuario) {
  validarLineas(lineas);
  await validarPermisoAnotador(juego_id, lineas, usuario);
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
  await validarPermisoAnotador(juego_id, lineas, usuario);
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
