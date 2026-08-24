const contenidoService = require('../services/contenidoService');

async function obtener(req, res, next) {
  try { res.json(await contenidoService.obtener()); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await contenidoService.actualizar(req.body)); } catch (err) { next(err); }
}

module.exports = { obtener, actualizar };
