const express = require('express');
const router = express.Router();
const controller = require('../controllers/juegosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Calendario / resultados: público
// GET admite ?temporada_categoria_id= &equipo_inscrito_id= &estado=
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.get('/:id/entradas', controller.listarEntradas);

// Programar / eliminar un juego: exclusivo del administrador —
// el anotador NUNCA puede crear juegos.
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

// Cargar resultado y entradas: administrador o anotador — el service
// valida que el anotador solo pueda tocar juegos de su propio equipo.
const canWriteResultado = [requireAuth, requireRole('administrador', 'anotador')];
router.put('/:id', ...canWriteResultado, controller.actualizar);
router.put('/:id/entradas', ...canWriteResultado, controller.guardarEntradas);

module.exports = router;