const temporadasService = require('../services/temporadasService');

async function listar(req, res, next) {
  try { res.json(await temporadasService.listar()); } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try { res.json(await temporadasService.obtener(req.params.id)); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await temporadasService.crear(req.body)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await temporadasService.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await temporadasService.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

// ---- temporada_categoria (activar una categoría dentro de una temporada) ----

async function listarCategoriasDeTemporada(req, res, next) {
  try {
    res.json(await temporadasService.listarCategoriasDeTemporada(req.query.temporada_id));
  } catch (err) { next(err); }
}

async function crearCruce(req, res, next) {
  try { res.status(201).json(await temporadasService.crearCruce(req.body)); } catch (err) { next(err); }
}

async function actualizarCruce(req, res, next) {
  try {
    res.json(await temporadasService.actualizarCruce(req.params.id, req.body));
  } catch (err) { next(err); }
}

async function eliminarCruce(req, res, next) {
  try {
    await temporadasService.eliminarCruce(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarCategoriasDeTemporada, crearCruce, actualizarCruce, eliminarCruce,
};
