const usuariosService = require('../services/usuariosService');

async function listarAnotadores(req, res, next) {
  try { res.json(await usuariosService.listarAnotadores()); } catch (err) { next(err); }
}

async function crearAnotador(req, res, next) {
  try { res.status(201).json(await usuariosService.crearAnotador(req.body)); } catch (err) { next(err); }
}

async function actualizarEquipo(req, res, next) {
  try { res.json(await usuariosService.actualizarEquipo(req.params.id, req.body.equipo_inscrito_id)); } catch (err) { next(err); }
}

async function cambiarPassword(req, res, next) {
  try { res.json(await usuariosService.cambiarPassword(req.params.id, req.body.password)); } catch (err) { next(err); }
}

async function desactivar(req, res, next) {
  try { await usuariosService.desactivar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

async function reactivar(req, res, next) {
  try { res.json(await usuariosService.reactivar(req.params.id)); } catch (err) { next(err); }
}

module.exports = { listarAnotadores, crearAnotador, actualizarEquipo, cambiarPassword, desactivar, reactivar };