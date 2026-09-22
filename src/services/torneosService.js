const torneosModel = require('../models/torneosModel');

function error(msg, status = 400) {
  const e = new Error(msg); e.status = status; return e;
}

// ── Torneos ──────────────────────────────────────────────────────────

async function listar(temporada_categoria_id) {
  if (!temporada_categoria_id) throw error('temporada_categoria_id es requerido');
  return torneosModel.listarPorTemporadaCategoria(temporada_categoria_id);
}

async function obtener(id) {
  const t = await torneosModel.obtenerPorId(id);
  if (!t) throw error('Torneo no encontrado', 404);
  return t;
}

async function crear(datos) {
  if (!datos.temporada_categoria_id || !datos.nombre) {
    throw error('temporada_categoria_id y nombre son requeridos');
  }
  return torneosModel.crear(datos);
}

async function actualizar(id, datos) {
  await obtener(id);
  return torneosModel.actualizar(id, datos);
}

async function eliminar(id) {
  await obtener(id);
  return torneosModel.eliminar(id);
}

// ── Fases ─────────────────────────────────────────────────────────────

async function listarFases(torneo_id) {
  await obtener(torneo_id);
  return torneosModel.listarFases(torneo_id);
}

async function crearFase(torneo_id, datos) {
  await obtener(torneo_id);
  if (!datos.nombre) throw error('nombre de la fase es requerido');
  return torneosModel.crearFase({ torneo_id, ...datos });
}

async function eliminarFase(fase_id) {
  const fase = await torneosModel.obtenerFasePorId(fase_id);
  if (!fase) throw error('Fase no encontrada', 404);
  return torneosModel.eliminarFase(fase_id);
}

// ── Cruces ────────────────────────────────────────────────────────────

async function listarCruces(torneo_id) {
  return torneosModel.listarCrucesPorTorneo(torneo_id);
}

async function crearCruce(datos) {
  const { fase_id, equipo_local_id, equipo_visitante_id } = datos;
  if (!fase_id || !equipo_local_id || !equipo_visitante_id) {
    throw error('fase_id, equipo_local_id y equipo_visitante_id son requeridos');
  }
  if (equipo_local_id === equipo_visitante_id) {
    throw error('El equipo local y visitante deben ser distintos');
  }
  return torneosModel.crearCruce(datos);
}

async function actualizarCruce(id, datos) {
  const cruce = await torneosModel.obtenerCrucePorId(id);
  if (!cruce) throw error('Cruce no encontrado', 404);
  const actualizado = await torneosModel.actualizarCruce(id, datos);
  // Sincronizar ganador automáticamente si hay juego vinculado
  await torneosModel.sincronizarGanador(id);
  return torneosModel.obtenerCrucePorId(id);
}

async function eliminarCruce(id) {
  const cruce = await torneosModel.obtenerCrucePorId(id);
  if (!cruce) throw error('Cruce no encontrado', 404);
  return torneosModel.eliminarCruce(id);
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarFases, crearFase, eliminarFase,
  listarCruces, crearCruce, actualizarCruce, eliminarCruce,
};
