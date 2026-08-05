const express = require('express');
const router = express.Router();
const controller = require('../controllers/jugadoresController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rutas fijas ('/roster') ANTES que las de parámetro ('/:id')

// Roster: ?equipo_inscrito_id=X en el GET
router.get('/roster', controller.listarRoster);
router.post('/roster', requireAuth, requireRole('administrador'), controller.agregarARoster);
router.put('/roster/:id', requireAuth, requireRole('administrador'), controller.actualizarRoster);
router.delete('/roster/:id', requireAuth, requireRole('administrador'), controller.eliminarDeRoster);

// Catálogo general de jugadores
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.put('/:id', requireAuth, requireRole('administrador'), controller.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;
