const express = require('express');
const router = express.Router();
const controller = require('../controllers/estadisticasController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura pública — el mismo endpoint que usaba boxscore antes
router.get('/:juego_id', controller.obtener);

// Escritura: administrador o anotador pueden cargar estadísticas
const canWrite = [requireAuth, requireRole('administrador', 'anotador')];

// body: { lineas: [{ roster_id, vb, ca, hc, ... }] }
router.put('/:juego_id/bateo',   ...canWrite, controller.guardarBateo);
router.put('/:juego_id/pitcheo', ...canWrite, controller.guardarPitcheo);
router.put('/:juego_id/fildeo',  ...canWrite, controller.guardarFildeo);

module.exports = router;
