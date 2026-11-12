const fasesService = require('../services/fasesService');

async function listar(req, res, next) {
  try { res.json(await fasesService.listar(req.query.temporada_categoria_id)); } catch (err) { next(err); }
}

async function equipos(req, res, next) {
  try {
    res.json(await fasesService.equipos(req.query.temporada_categoria_id, req.query.fase));
  } catch (err) { next(err); }
}

async function guardarEquipos(req, res, next) {
  try {
    const { temporada_categoria_id, equipos: lista } = req.body;
    res.json(await fasesService.guardarEquipos(temporada_categoria_id, req.params.fase, lista));
  } catch (err) { next(err); }
}

module.exports = { listar, equipos, guardarEquipos };
