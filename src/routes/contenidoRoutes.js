const express = require('express');
const router = express.Router();
const controller = require('../controllers/contenidoController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', controller.obtener); // pública
router.put('/', requireAuth, requireRole('administrador'), controller.actualizar);

module.exports = router;
