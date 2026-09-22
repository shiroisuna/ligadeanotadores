const express = require('express');
const router = express.Router();
const controller = require('../controllers/estadiosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura pública (para elegir estadio al programar juegos, o mostrarlo en boxscore)
router.get('/', controller.listar);

// Escritura: solo administrador
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.put('/:id', requireAuth, requireRole('administrador'), controller.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;