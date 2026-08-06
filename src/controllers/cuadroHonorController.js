const cuadroHonorService = require('../services/cuadroHonorService');

async function obtener(req, res, next) {
  try {
    res.json(await cuadroHonorService.obtener(req.query.temporada_categoria_id));
  } catch (err) { next(err); }
}

module.exports = { obtener };
