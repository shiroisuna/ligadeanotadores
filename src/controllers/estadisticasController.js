const estadisticasService = require('../services/estadisticasService');

async function obtener(req, res, next) {
  try {
    res.json(await estadisticasService.obtenerEstadisticas(req.params.juego_id));
  } catch (err) { next(err); }
}

async function guardarBateo(req, res, next) {
  try {
    res.json(await estadisticasService.guardarBateo(req.params.juego_id, req.body.lineas));
  } catch (err) { next(err); }
}

async function guardarPitcheo(req, res, next) {
  try {
    res.json(await estadisticasService.guardarPitcheo(req.params.juego_id, req.body.lineas));
  } catch (err) { next(err); }
}

async function guardarFildeo(req, res, next) {
  try {
    res.json(await estadisticasService.guardarFildeo(req.params.juego_id, req.body.lineas));
  } catch (err) { next(err); }
}

module.exports = { obtener, guardarBateo, guardarPitcheo, guardarFildeo };
