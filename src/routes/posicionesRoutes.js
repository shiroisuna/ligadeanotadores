const express = require('express');
const router = express.Router();
const controller = require('../controllers/posicionesController');

// Totalmente pública. GET /api/posiciones?temporada_categoria_id=1
router.get('/', controller.obtener);

module.exports = router;
