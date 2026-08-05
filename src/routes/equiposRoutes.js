const express = require('express');
const router = express.Router();
const controller = require('../controllers/equiposController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// IMPORTANTE: las rutas fijas ('/inscritos') van ANTES de las rutas con
// parámetro ('/:id'), si no Express interpreta "inscritos" como un :id.

// Inscripciones: ?temporada_categoria_id=X en el GET
router.get('/inscritos', controller.listarInscritos);
router.post('/inscritos', requireAuth, requireRole('administrador'), controller.inscribir);
router.put('/inscritos/:id', requireAuth, requireRole('administrador'), controller.actualizarInscripcion);
router.delete('/inscritos/:id', requireAuth, requireRole('administrador'), controller.eliminarInscripcion);

// Catálogo general de equipos
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.put('/:id', requireAuth, requireRole('administrador'), controller.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;
