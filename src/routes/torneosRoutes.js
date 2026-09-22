const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/torneosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const pub    = [];                                          // público
const admin  = [requireAuth, requireRole('administrador')];
const writer = [requireAuth, requireRole('administrador', 'anotador')];

// Torneos
router.get('/',          ...pub,    ctrl.listar);          // ?temporada_categoria_id=X
router.get('/:id',       ...pub,    ctrl.obtener);
router.post('/',         ...admin,  ctrl.crear);
router.put('/:id',       ...admin,  ctrl.actualizar);
router.delete('/:id',    ...admin,  ctrl.eliminar);

// Fases
router.get('/:torneoId/fases',           ...pub,    ctrl.listarFases);
router.post('/:torneoId/fases',          ...admin,  ctrl.crearFase);
router.delete('/:torneoId/fases/:faseId',...admin,  ctrl.eliminarFase);

// Cruces
router.get('/:torneoId/cruces',                 ...pub,    ctrl.listarCruces);
router.post('/:torneoId/cruces',                ...admin,  ctrl.crearCruce);
router.put('/:torneoId/cruces/:cruceId',        ...writer, ctrl.actualizarCruce);
router.delete('/:torneoId/cruces/:cruceId',     ...admin,  ctrl.eliminarCruce);

module.exports = router;
