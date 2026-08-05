const equiposService = require('../services/equiposService');

async function listar(req, res, next) {
  try { res.json(await equiposService.listar()); } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try { res.json(await equiposService.obtener(req.params.id)); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await equiposService.crear(req.body)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await equiposService.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await equiposService.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

// ---- inscripciones (equipo dentro de una temporada+categoría) ----

async function listarInscritos(req, res, next) {
  try {
    res.json(await equiposService.listarInscritos(req.query.temporada_categoria_id));
  } catch (err) { next(err); }
}

async function inscribir(req, res, next) {
  try { res.status(201).json(await equiposService.inscribir(req.body)); } catch (err) { next(err); }
}

async function actualizarInscripcion(req, res, next) {
  try {
    res.json(await equiposService.actualizarInscripcion(req.params.id, req.body));
  } catch (err) { next(err); }
}

async function eliminarInscripcion(req, res, next) {
  try {
    await equiposService.eliminarInscripcion(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarInscritos, inscribir, actualizarInscripcion, eliminarInscripcion,
};
