const svc = require('../services/controlLanzadoresService');

async function listar(req, res, next) {
  try { res.json(await svc.listar(req.query.temporada_categoria_id)); } catch (e) { next(e); }
}
async function registrar(req, res, next) {
  try { res.status(201).json(await svc.registrar(req.body)); } catch (e) { next(e); }
}
async function eliminar(req, res, next) {
  try { await svc.eliminar(req.params.id); res.status(204).send(); } catch (e) { next(e); }
}
async function listarReglas(req, res, next) {
  try { res.json(await svc.listarReglas()); } catch (e) { next(e); }
}
async function actualizarRegla(req, res, next) {
  try { res.json(await svc.actualizarRegla(req.params.id, req.body)); } catch (e) { next(e); }
}

module.exports = { listar, registrar, eliminar, listarReglas, actualizarRegla };
