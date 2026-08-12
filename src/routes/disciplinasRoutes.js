const express = require('express');
const router = express.Router();
const controller = require('../controllers/disciplinasController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', controller.listar); // pública, para el selector de categorías
router.post('/', requireAuth, requireRole('administrador'), controller.crear);

module.exports = router;
