const express = require('express');
const router = express.Router();
const controller = require('../controllers/juegosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Calendario / resultados: público
// GET admite ?temporada_categoria_id= &equipo_inscrito_id= &estado=
router.get('/', controller.listar);
// Juegos que el administrador le asignó al anotador que consulta
router.get('/mis-asignados', requireAuth, requireRole('anotador', 'administrador'), controller.misAsignados);
router.get('/:id', controller.obtener);
router.get('/:id/entradas', controller.listarEntradas);

// Programar / eliminar un juego: exclusivo del administrador —
// el anotador NUNCA puede crear juegos.
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

// Asignar anotadores a un juego específico: solo administrador
router.get('/:id/anotadores', requireAuth, requireRole('administrador'), controller.listarAnotadores);
router.put('/:id/anotadores', requireAuth, requireRole('administrador'), controller.asignarAnotadores);

// Cargar resultado y entradas: administrador o anotador — el service
// valida que el anotador solo toque juegos que se le asignaron (o de su equipo).
const canWriteResultado = [requireAuth, requireRole('administrador', 'anotador')];
router.put('/:id', ...canWriteResultado, controller.actualizar);
router.put('/:id/entradas', ...canWriteResultado, controller.guardarEntradas);

module.exports = router;
