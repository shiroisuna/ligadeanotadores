const disciplinasService = require('../services/disciplinasService');

async function listar(req, res, next) {
  try { res.json(await disciplinasService.listar()); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await disciplinasService.crear(req.body)); } catch (err) { next(err); }
}

module.exports = { listar, crear };
