const boxscoreService = require('../services/boxscoreService');

async function obtener(req, res, next) {
  try { res.json(await boxscoreService.obtenerBoxscore(req.params.juego_id)); } catch (err) { next(err); }
}

// body: { lineas: [ { roster_id, vb, ca, hc, ... }, ... ] }
async function guardarBateo(req, res, next) {
  try {
    res.json(await boxscoreService.guardarBateo(req.params.juego_id, req.body.lineas));
  } catch (err) { next(err); }
}

async function guardarPitcheo(req, res, next) {
  try {
    res.json(await boxscoreService.guardarPitcheo(req.params.juego_id, req.body.lineas));
  } catch (err) { next(err); }
}

async function eliminarBateo(req, res, next) {
  try { await boxscoreService.eliminarBateo(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

async function eliminarPitcheo(req, res, next) {
  try { await boxscoreService.eliminarPitcheo(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

module.exports = { obtener, guardarBateo, guardarPitcheo, eliminarBateo, eliminarPitcheo };
