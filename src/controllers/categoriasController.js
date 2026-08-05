const categoriasService = require('../services/categoriasService');

async function listar(req, res, next) {
  try {
    res.json(await categoriasService.listar());
  } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    res.json(await categoriasService.obtener(req.params.id));
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await categoriasService.crear(req.body));
  } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try {
    res.json(await categoriasService.actualizar(req.params.id, req.body));
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    await categoriasService.eliminar(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
