const arbitrosService = require('../services/arbitrosService');

async function listar(req, res, next) {
  try { res.json(await arbitrosService.listar()); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await arbitrosService.crear(req.body)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await arbitrosService.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}

async function desactivar(req, res, next) {
  try { await arbitrosService.desactivar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

async function listarPorJuego(req, res, next) {
  try { res.json(await arbitrosService.listarPorJuego(req.params.juego_id)); } catch (err) { next(err); }
}

async function guardarPorJuego(req, res, next) {
  try {
    res.json(await arbitrosService.guardarPorJuego(req.params.juego_id, req.body.arbitros));
  } catch (err) { next(err); }
}

module.exports = { listar, crear, actualizar, desactivar, listarPorJuego, guardarPorJuego };