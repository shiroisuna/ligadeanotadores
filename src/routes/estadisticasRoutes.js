const express = require('express');
const router = express.Router();
const controller = require('../controllers/estadisticasController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Colectivo de TODOS los equipos de una categoría (vista pública)
// GET /api/estadisticas/colectivo?temporada_categoria_id=X
// Debe ir ANTES de /colectivo/:equipo_inscrito_id y de /:juego_id.
router.get('/colectivo', controller.obtenerColectivoPorCategoria);

// Colectivo de UN equipo (acumulado de temporada) — debe ir ANTES de /:juego_id
// para que Express no confunda "colectivo" con un juego_id.
router.get('/colectivo/:equipo_inscrito_id', controller.obtenerColectivo);

// Lectura pública — el mismo endpoint que usaba boxscore antes
router.get('/:juego_id', controller.obtener);

// Escritura: administrador o anotador pueden cargar estadísticas
const canWrite = [requireAuth, requireRole('administrador', 'anotador')];

// body: { lineas: [{ roster_id, vb, ca, hc, ... }] }
router.put('/:juego_id/bateo',   ...canWrite, controller.guardarBateo);
router.put('/:juego_id/pitcheo', ...canWrite, controller.guardarPitcheo);
router.put('/:juego_id/fildeo',  ...canWrite, controller.guardarFildeo);

module.exports = router;