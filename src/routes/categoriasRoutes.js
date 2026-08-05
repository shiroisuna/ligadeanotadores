const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Lectura: pública (cualquier visitante del sitio consulta categorías)
router.get('/', categoriasController.listar);
router.get('/:id', categoriasController.obtener);

// Escritura: solo administrador
router.post('/', requireAuth, requireRole('administrador'), categoriasController.crear);
router.put('/:id', requireAuth, requireRole('administrador'), categoriasController.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), categoriasController.eliminar);

module.exports = router;
