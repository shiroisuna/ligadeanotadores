const express = require('express');
const router = express.Router();
const controller = require('../controllers/fotosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', controller.listar); // pública, para el carrusel del inicio
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;
