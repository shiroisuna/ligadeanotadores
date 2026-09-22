const express = require('express');
const router = express.Router();
const controller = require('../controllers/incidenciasController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rango de fechas (reporte público) — debe ir ANTES de /:juego_id
// GET /api/incidencias?temporada_categoria_id=1&fecha_inicio=2026-01-01&fecha_fin=2026-01-31
router.get('/', controller.listarPorRangoFecha);

// Lectura pública por juego — para poder generar el PDF desde la vista pública
router.get('/:juego_id', controller.listarPorJuego);

// Escritura: administrador o anotador
const canWrite = [requireAuth, requireRole('administrador', 'anotador')];
router.post('/', ...canWrite, controller.crear);
router.delete('/:id', ...canWrite, controller.eliminar);

module.exports = router;