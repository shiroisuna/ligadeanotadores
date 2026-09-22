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

async function porEquipo(req, res, next) {
  try {
    res.json(await lideresService.estadisticasPorEquipo(req.query.temporada_categoria_id, req.params.equipo_inscrito_id));
  } catch (err) { next(err); }
}

async function porJugador(req, res, next) {
  try {
    res.json(await lideresService.estadisticasPorJugador(req.params.roster_id));
  } catch (err) { next(err); }
}

async function defensiva(req, res, next) {
  try {
    const { temporada_categoria_id, limit } = req.query;
    res.json(await lideresService.lideresDefensiva({ temporada_categoria_id, limit }));
  } catch (err) { next(err); }
}

module.exports = { bateo, pitcheo, porEquipo, porJugador, defensiva };