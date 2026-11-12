const juegosService = require('../services/juegosService');

async function listar(req, res, next) {
  try {
    const { temporada_categoria_id, equipo_inscrito_id, estado, fase } = req.query;
    res.json(await juegosService.listar({ temporada_categoria_id, equipo_inscrito_id, estado, fase }));
  } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try { res.json(await juegosService.obtener(req.params.id)); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await juegosService.crear(req.body)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await juegosService.actualizar(req.params.id, req.body, req.usuario)); } catch (err) { next(err); }
}

async function resumenDatos(req, res, next) {
  try { res.json(await juegosService.resumenDatos(req.params.id)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await juegosService.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

// ---- entradas ----

async function listarEntradas(req, res, next) {
  try { res.json(await juegosService.listarEntradas(req.params.id)); } catch (err) { next(err); }
}

async function guardarEntradas(req, res, next) {
  try {
    res.json(await juegosService.guardarEntradas(req.params.id, req.body.entradas, req.usuario));
  } catch (err) { next(err); }
}

async function listarAnotadores(req, res, next) {
  try { res.json(await juegosService.listarAnotadoresDeJuego(req.params.id)); } catch (err) { next(err); }
}
async function asignarAnotadores(req, res, next) {
  try { res.json(await juegosService.asignarAnotadores(req.params.id, req.body.usuario_ids)); } catch (err) { next(err); }
}
async function misAsignados(req, res, next) {
  try { res.json(await juegosService.misJuegosAsignados(req.usuario)); } catch (err) { next(err); }
}

module.exports = { resumenDatos, listarAnotadores, asignarAnotadores, misAsignados, listar, obtener, crear, actualizar, eliminar, listarEntradas, guardarEntradas };
