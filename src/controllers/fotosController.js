const fotosService = require('../services/fotosService');

async function listar(req, res, next) {
  try { res.json(await fotosService.listar()); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await fotosService.crear(req.body)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await fotosService.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

module.exports = { listar, crear, eliminar };
