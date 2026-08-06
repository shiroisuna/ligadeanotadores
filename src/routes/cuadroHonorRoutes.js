const express = require('express');
const router = express.Router();
const controller = require('../controllers/cuadroHonorController');

// Totalmente pública. GET /api/cuadro-honor?temporada_categoria_id=1
router.get('/', controller.obtener);

module.exports = router;
