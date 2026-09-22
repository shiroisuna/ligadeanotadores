const express = require('express');
const router  = express.Router();
const model   = require('../models/aprobacionesModel');
const { requireAuth, requireRole } = require('../middlewares/auth');

const admin = [requireAuth, requireRole('administrador')];

async function h(fn, req, res, next) {
  try { res.json(await fn(req)); } catch (e) { next(e); }
}

// Conteo de pendientes (para el badge en el menú)
router.get('/pendientes/count', ...admin, (req, res, next) =>
  h(() => model.contarPendientes(), req, res, next));

// Listar pendientes
router.get('/pendientes/juegos', ...admin, (req, res, next) =>
  h(() => model.listarJuegosPendientes(), req, res, next));

router.get('/pendientes/estadisticas', ...admin, (req, res, next) =>
  h(() => model.listarEstadisticasPendientes(), req, res, next));

// Aprobar todo de un juego de una vez (resultado + estadísticas)
router.post('/juegos/:juego_id/aprobar', ...admin, (req, res, next) =>
  h(async () => {
    await model.aprobarTodo(req.params.juego_id);
    return { ok: true };
  }, req, res, next));

// Rechazar resultado de un juego
router.post('/juegos/:juego_id/rechazar-resultado', ...admin, (req, res, next) =>
  h(async () => {
    await model.rechazarJuego(req.params.juego_id);
    return { ok: true };
  }, req, res, next));

// Rechazar estadísticas de un juego
router.post('/juegos/:juego_id/rechazar-estadisticas', ...admin, (req, res, next) =>
  h(async () => {
    await model.rechazarEstadisticasJuego(req.params.juego_id);
    return { ok: true };
  }, req, res, next));

module.exports = router;
