const pagosService = require('../services/pagosService');

async function miEstado(req, res, next) {
  try { res.json(await pagosService.miEstado(req.usuario.jugador_id)); } catch (err) { next(err); }
}

async function registrar(req, res, next) {
  try { res.status(201).json(await pagosService.registrar(req.usuario.jugador_id, req.body)); } catch (err) { next(err); }
}

async function listar(req, res, next) {
  try { res.json(await pagosService.listar(req.query.periodo)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await pagosService.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

module.exports = { miEstado, registrar, listar, eliminar };
