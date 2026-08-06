const lideresModel = require('../models/lideresModel');

function validarStatBateo(stat) {
  if (!lideresModel.STATS_BATEO[stat]) {
    const err = new Error(`stat inválido. Usa uno de: ${Object.keys(lideresModel.STATS_BATEO).join(', ')}`);
    err.status = 400;
    throw err;
  }
}

function validarStatPitcheo(stat) {
  if (!lideresModel.STATS_PITCHEO[stat]) {
    const err = new Error(`stat inválido. Usa uno de: ${Object.keys(lideresModel.STATS_PITCHEO).join(', ')}`);
    err.status = 400;
    throw err;
  }
}

function validarTemporadaCategoria(temporada_categoria_id) {
  if (!temporada_categoria_id) {
    const err = new Error('temporada_categoria_id es requerido');
    err.status = 400;
    throw err;
  }
}

async function lideresBateo({ temporada_categoria_id, stat, posicion, limit }) {
  validarTemporadaCategoria(temporada_categoria_id);
  validarStatBateo(stat);
  return lideresModel.lideresBateo(temporada_categoria_id, stat, posicion, limit);
}

async function lideresPitcheo({ temporada_categoria_id, stat, limit }) {
  validarTemporadaCategoria(temporada_categoria_id);
  validarStatPitcheo(stat);
  return lideresModel.lideresPitcheo(temporada_categoria_id, stat, limit);
}

module.exports = { lideresBateo, lideresPitcheo };
