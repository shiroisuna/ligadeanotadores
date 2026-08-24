const express = require('express');
const router = express.Router();
const controller = require('../controllers/pagosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// El jugador logueado: su propio estado y registrar su propio pago
router.get('/mi-estado', requireAuth, controller.miEstado);
router.post('/', requireAuth, controller.registrar);

// Admin: auditoría de todos los pagos registrados
router.get('/', requireAuth, requireRole('administrador'), controller.listar); // ?periodo=YYYY-MM
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;
