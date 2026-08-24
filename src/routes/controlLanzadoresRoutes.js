const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/controlLanzadoresController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Pública — para mostrar el estado de descanso en el sitio
router.get('/', ctrl.listar); // ?temporada_categoria_id=X

// Admin/Anotador
const canWrite = [requireAuth, requireRole('administrador', 'anotador')];
router.post('/',         ...canWrite, ctrl.registrar);
router.delete('/:id',    ...canWrite, ctrl.eliminar);

// Reglas de descanso — solo admin
router.get('/reglas',           requireAuth, requireRole('administrador'), ctrl.listarReglas);
router.put('/reglas/:id',       requireAuth, requireRole('administrador'), ctrl.actualizarRegla);

module.exports = router;
