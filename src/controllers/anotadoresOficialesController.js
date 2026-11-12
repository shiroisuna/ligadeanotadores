const anotadoresOficialesService = require('../services/anotadoresOficialesService');

async function listar(req, res, next) {
  try { res.json(await anotadoresOficialesService.listar()); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await anotadoresOficialesService.crear(req.body)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await anotadoresOficialesService.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}

async function desactivar(req, res, next) {
  try { await anotadoresOficialesService.desactivar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

async function listarPorJuego(req, res, next) {
  try { res.json(await anotadoresOficialesService.listarPorJuego(req.params.juego_id)); } catch (err) { next(err); }
}

async function guardarPorJuego(req, res, next) {
  try {
    res.json(await anotadoresOficialesService.guardarPorJuego(req.params.juego_id, req.body.anotadores));
  } catch (err) { next(err); }
}

module.exports = { listar, crear, actualizar, desactivar, listarPorJuego, guardarPorJuego };
