const express = require('express');
const router = express.Router();
const controller = require('../controllers/temporadasController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rutas fijas ('/categorias') ANTES que las de parámetro ('/:id')

// temporada_categoria: activa una categoría dentro de una temporada (con su copa)
// GET usa ?temporada_id=X
router.get('/categorias', controller.listarCategoriasDeTemporada);
router.post('/categorias', requireAuth, requireRole('administrador'), controller.crearCruce);
router.put('/categorias/:id', requireAuth, requireRole('administrador'), controller.actualizarCruce);
router.delete('/categorias/:id', requireAuth, requireRole('administrador'), controller.eliminarCruce);

// Catálogo general de temporadas
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.put('/:id', requireAuth, requireRole('administrador'), controller.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);

module.exports = router;
