const incidenciasService = require('../services/incidenciasService');

async function listarPorJuego(req, res, next) {
  try {
    res.json(await incidenciasService.listarPorJuego(req.params.juego_id));
  } catch (err) { next(err); }
}

async function listarPorRangoFecha(req, res, next) {
  try {
    const { temporada_categoria_id, fecha_inicio, fecha_fin } = req.query;
    res.json(await incidenciasService.listarPorRangoFecha({ temporada_categoria_id, fecha_inicio, fecha_fin }));
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await incidenciasService.crear(req.body));
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    await incidenciasService.eliminar(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listarPorJuego, listarPorRangoFecha, crear, eliminar };