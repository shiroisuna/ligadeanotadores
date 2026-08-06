const express = require('express');
const router = express.Router();
const controller = require('../controllers/lideresController');

// Totalmente pública.
// GET /api/lideres/bateo?temporada_categoria_id=1&stat=hits&limit=10
// GET /api/lideres/bateo?temporada_categoria_id=1&stat=promedio_bateo&posicion=SS  (líder por posición)
// GET /api/lideres/pitcheo?temporada_categoria_id=1&stat=efectividad&limit=5
router.get('/bateo', controller.bateo);
router.get('/pitcheo', controller.pitcheo);

module.exports = router;
