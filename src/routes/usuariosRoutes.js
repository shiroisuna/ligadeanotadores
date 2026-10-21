const express = require('express');
const router = express.Router();
const c = require('../controllers/usuariosController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const soloAdmin = [requireAuth, requireRole('administrador')];

// Cualquier usuario autenticado cambia su propia clave (va ANTES de /:id)
router.put('/mi-password', requireAuth, c.miPassword);

// ── Gestión completa (solo administrador) ──
router.get('/',                 ...soloAdmin, c.listarTodos);
router.post('/',                ...soloAdmin, c.crear);
router.put('/:id',              ...soloAdmin, c.actualizar);          // email, rol, equipo
router.put('/:id/password',     ...soloAdmin, c.resetPassword);       // reset de clave
router.delete('/:id',           ...soloAdmin, c.desactivar);          // desactivar
router.post('/:id/reactivar',   ...soloAdmin, c.reactivar);

// ── Compatibilidad con la pantalla de Anotadores ──
router.get('/anotadores',                ...soloAdmin, c.listarAnotadores);
router.post('/anotadores',               ...soloAdmin, c.crearAnotador);
router.put('/anotadores/:id/equipo',     ...soloAdmin, c.actualizarEquipo);
router.put('/anotadores/:id/password',   ...soloAdmin, c.cambiarPassword);
router.delete('/anotadores/:id',         ...soloAdmin, c.desactivar);
router.post('/anotadores/:id/reactivar', ...soloAdmin, c.reactivar);

module.exports = router;