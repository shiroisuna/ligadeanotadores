const service = require('../services/controlLanzadoresService');

async function listarPorRoster(req, res, next) {
  try { res.json(await service.listarPorRoster(req.query.roster_id)); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await service.crear(req.body)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await service.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

async function resumenUltimosDias(req, res, next) {
  try {
    res.json(await service.resumenUltimosDias(req.query.roster_id, req.query.dias));
  } catch (err) { next(err); }
}

module.exports = { listarPorRoster, crear, eliminar, resumenUltimosDias };
