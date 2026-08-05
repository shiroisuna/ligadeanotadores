const express = require('express');
const router = express.Router();
const controller = require('../controllers/juegosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Calendario / resultados: público
// GET admite ?temporada_categoria_id= &equipo_inscrito_id= &estado=
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.get('/:id/entradas', controller.listarEntradas);

// Programar / editar resultado: solo administrador
router.post('/', requireAuth, requireRole('administrador'), controller.crear);
router.put('/:id', requireAuth, requireRole('administrador'), controller.actualizar);
router.delete('/:id', requireAuth, requireRole('administrador'), controller.eliminar);
// body: { entradas: [{ equipo_inscrito_id, numero_entrada, carreras }, ...] }
router.put('/:id/entradas', requireAuth, requireRole('administrador'), controller.guardarEntradas);

module.exports = router;
