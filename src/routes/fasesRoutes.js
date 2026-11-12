const express = require('express');
const router = express.Router();
const controller = require('../controllers/fasesController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura pública (el portal arma las pestañas de fases y las matrices de cruces)
router.get('/', controller.listar);
router.get('/equipos', controller.equipos);
// Solo admin define quién juega cada fase
router.put('/:fase/equipos', requireAuth, requireRole('administrador'), controller.guardarEquipos);

module.exports = router;
