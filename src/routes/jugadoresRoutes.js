const express = require('express');
const router = express.Router();
const controller = require('../controllers/jugadoresController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rutas fijas ('/roster', '/mi-perfil') ANTES que las de parámetro ('/:id')

// Perfil del jugador logueado — su propio jugador_id sale del token
router.get('/mi-perfil', requireAuth, controller.miPerfil);

// Perfil con contacto de un roster específico — admin, o el propio dueño
router.get('/perfil/:roster_id', requireAuth, controller.perfilContacto);

// Roster: ?equipo_inscrito_id=X en el GET
router.get('/roster', controller.listarRoster);
router.post('/roster', requireAuth, requireRole('administrador'), controller.agregarARoster);
router.put('/roster/:id', requireAuth, requireRole('administrador'), controller.actualizarRoster);
router.delete('/roster/:id', requireAuth, requireRole('administrador'), controller.eliminarDeRoster);

// Catálogo general de jugadores
router.get('/', controller.listar);
router.get('/:id', requireAuth, requireRole('administrador'), controller.obtener);
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.put('/:id', requireAuth, requireRole('administrador'), controller.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;
