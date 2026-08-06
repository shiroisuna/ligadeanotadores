const model = require('../models/controlLanzadoresModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

async function listarPorRoster(roster_id) {
  if (!roster_id) {
    const err = new Error('roster_id es requerido');
    err.status = 400;
    throw err;
  }
  return model.listarPorRoster(roster_id);
}

async function crear(datos) {
  const { roster_id, fecha, innings_lanzados, condicion } = datos;
  if (!roster_id || !fecha || innings_lanzados === undefined || !condicion) {
    const err = new Error('roster_id, fecha, innings_lanzados y condicion son requeridos');
    err.status = 400;
    throw err;
  }
  if (!['completa', 'descansa'].includes(condicion)) {
    const err = new Error("condicion debe ser 'completa' o 'descansa'");
    err.status = 400;
    throw err;
  }
  return model.crear(datos);
}

async function eliminar(id) {
  const registro = await model.obtenerPorId(id);
  if (!registro) throw noEncontrado('Registro no encontrado');
  return model.eliminar(id);
}

async function resumenUltimosDias(roster_id, dias) {
  if (!roster_id) {
    const err = new Error('roster_id es requerido');
    err.status = 400;
    throw err;
  }
  const diasNum = Number.parseInt(dias, 10);
  return model.resumenUltimosDias(roster_id, Number.isFinite(diasNum) && diasNum > 0 ? diasNum : 7);
}

module.exports = { listarPorRoster, crear, eliminar, resumenUltimosDias };
