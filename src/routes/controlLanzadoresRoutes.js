const express = require('express');
const router = express.Router();
const controller = require('../controllers/controlLanzadoresController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rutas fijas antes que las de parámetro
router.get('/resumen', controller.resumenUltimosDias); // ?roster_id=X&dias=7

// Lectura: pública (el jugador puede ver su propio historial)
router.get('/', controller.listarPorRoster); // ?roster_id=X

// Escritura: solo administrador
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;
