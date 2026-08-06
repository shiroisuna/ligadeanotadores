const posicionesService = require('../services/posicionesService');

async function obtener(req, res, next) {
  try {
    res.json(await posicionesService.obtener(req.query.temporada_categoria_id));
  } catch (err) { next(err); }
}

module.exports = { obtener };
