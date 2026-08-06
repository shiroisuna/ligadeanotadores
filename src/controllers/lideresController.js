const lideresService = require('../services/lideresService');

async function bateo(req, res, next) {
  try {
    const { temporada_categoria_id, stat, posicion, limit } = req.query;
    res.json(await lideresService.lideresBateo({ temporada_categoria_id, stat, posicion, limit }));
  } catch (err) { next(err); }
}

async function pitcheo(req, res, next) {
  try {
    const { temporada_categoria_id, stat, limit } = req.query;
    res.json(await lideresService.lideresPitcheo({ temporada_categoria_id, stat, limit }));
  } catch (err) { next(err); }
}

module.exports = { bateo, pitcheo };
