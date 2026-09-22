const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuariosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Todo este módulo es exclusivo del administrador.
const soloAdmin = [requireAuth, requireRole('administrador')];

router.get('/anotadores', ...soloAdmin, controller.listarAnotadores);
router.post('/anotadores', ...soloAdmin, controller.crearAnotador);
router.put('/anotadores/:id/equipo', ...soloAdmin, controller.actualizarEquipo);
router.put('/anotadores/:id/password', ...soloAdmin, controller.cambiarPassword);
router.delete('/anotadores/:id', ...soloAdmin, controller.desactivar);
router.post('/anotadores/:id/reactivar', ...soloAdmin, controller.reactivar);

module.exports = router;