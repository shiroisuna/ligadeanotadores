const estadiosService = require('../services/estadiosService');

async function listar(req, res, next) {
  try { res.json(await estadiosService.listar()); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await estadiosService.crear(req.body)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await estadiosService.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await estadiosService.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

module.exports = { listar, crear, actualizar, eliminar };