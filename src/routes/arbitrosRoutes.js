const express = require('express');
const router = express.Router();
const controller = require('../controllers/arbitrosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Catálogo — lectura pública (para mostrarlos en boxscore), escritura solo admin
router.get('/', controller.listar);
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.put('/:id', requireAuth, requireRole('administrador'), controller.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.desactivar);

// Árbitros de un juego específico — lectura pública, escritura admin/anotador
router.get('/juego/:juego_id', controller.listarPorJuego);
router.put('/juego/:juego_id', requireAuth, requireRole('administrador', 'anotador'), controller.guardarPorJuego);

module.exports = router;