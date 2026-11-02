const express = require('express');
const router = express.Router();
const controller = require('../controllers/boxscoreController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura: pública — el detalle del juego que ve cualquier visitante
router.get('/:juego_id/edicion', requireAuth, requireRole('administrador', 'anotador'), controller.obtenerParaEdicion);
router.get('/:juego_id', controller.obtener);

// Escritura: administrador, o anotador con el juego asignado (el service lo valida). Body: { lineas: [ {roster_id, ...stats}, ... ] }
router.put('/:juego_id/bateo', requireAuth, requireRole('administrador', 'anotador'), controller.guardarBateo);
router.put('/:juego_id/pitcheo', requireAuth, requireRole('administrador', 'anotador'), controller.guardarPitcheo);

router.delete('/bateo/:id', requireAuth, requireRole('administrador'), controller.eliminarBateo);
router.delete('/pitcheo/:id', requireAuth, requireRole('administrador'), controller.eliminarPitcheo);

module.exports = router;
