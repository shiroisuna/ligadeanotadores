const incidenciasModel = require('../models/incidenciasModel');

function validar(datos) {
  if (!datos.juego_id) {
    const err = new Error('juego_id es requerido');
    err.status = 400;
    throw err;
  }
  if (!datos.descripcion || !datos.descripcion.trim()) {
    const err = new Error('descripcion es requerida');
    err.status = 400;
    throw err;
  }
  if (datos.tipo && !incidenciasModel.TIPOS.includes(datos.tipo)) {
    const err = new Error(`tipo inválido. Usa uno de: ${incidenciasModel.TIPOS.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

async function listarPorJuego(juego_id) {
  if (!juego_id) {
    const err = new Error('juego_id es requerido');
    err.status = 400;
    throw err;
  }
  return incidenciasModel.listarPorJuego(juego_id);
}

async function listarPorRangoFecha({ temporada_categoria_id, fecha_inicio, fecha_fin }) {
  if (!temporada_categoria_id || !fecha_inicio || !fecha_fin) {
    const err = new Error('temporada_categoria_id, fecha_inicio y fecha_fin son requeridos');
    err.status = 400;
    throw err;
  }
  return incidenciasModel.listarPorRangoFecha(temporada_categoria_id, fecha_inicio, fecha_fin);
}

async function crear(datos) {
  validar(datos);
  return incidenciasModel.crear({
    juego_id: datos.juego_id,
    roster_id: datos.roster_id || null,
    tipo: datos.tipo || 'novedad',
    descripcion: datos.descripcion.trim(),
  });
}

async function eliminar(id) {
  return incidenciasModel.eliminar(id);
}

module.exports = { listarPorJuego, listarPorRangoFecha, crear, eliminar };