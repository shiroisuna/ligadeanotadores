const express = require('express');
const router = express.Router();
const controller = require('../controllers/boxscoreController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura: pública — el detalle del juego que ve cualquier visitante
router.get('/:juego_id', controller.obtener);

// Escritura: solo administrador. Body: { lineas: [ {roster_id, ...stats}, ... ] }
router.put('/:juego_id/bateo', requireAuth, requireRole('administrador'), controller.guardarBateo);
router.put('/:juego_id/pitcheo', requireAuth, requireRole('administrador'), controller.guardarPitcheo);

router.delete('/bateo/:id', requireAuth, requireRole('administrador'), controller.eliminarBateo);
router.delete('/pitcheo/:id', requireAuth, requireRole('administrador'), controller.eliminarPitcheo);

module.exports = router;
