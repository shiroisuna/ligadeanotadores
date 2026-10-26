const express = require('express');
const router = express.Router();
const controller = require('../controllers/boxscoreController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura: pública — el detalle del juego que ve cualquier visitante
router.get('/:juego_id', controller.obtener);

// Escritura: administrador o el anotador asignado al juego.
// Body: { lineas: [ {roster_id, ...stats}, ... ] }. Al guardar se generan
// las estadísticas del juego como pendientes de aprobación.
const canWrite = [requireAuth, requireRole('administrador', 'anotador')];
router.put('/:juego_id/bateo', ...canWrite, controller.guardarBateo);
router.put('/:juego_id/pitcheo', ...canWrite, controller.guardarPitcheo);

router.delete('/bateo/:id', requireAuth, requireRole('administrador'), controller.eliminarBateo);
router.delete('/pitcheo/:id', requireAuth, requireRole('administrador'), controller.eliminarPitcheo);

module.exports = router;
