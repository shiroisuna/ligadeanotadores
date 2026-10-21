const svc = require('../services/usuariosService');

const envolver = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (err) { next(err); } };

module.exports = {
  listarTodos:   envolver(async (req, res) => res.json(await svc.listarTodos())),
  crear:         envolver(async (req, res) => res.status(201).json(await svc.crear(req.body))),
  actualizar:    envolver(async (req, res) => res.json(await svc.actualizar(req.params.id, req.body, req.usuario))),
  resetPassword: envolver(async (req, res) => res.json(await svc.resetPassword(req.params.id, req.body.password))),
  desactivar:    envolver(async (req, res) => { await svc.desactivar(req.params.id, req.usuario); res.status(204).send(); }),
  reactivar:     envolver(async (req, res) => res.json(await svc.reactivar(req.params.id))),
  miPassword:    envolver(async (req, res) => res.json(await svc.cambiarMiPassword(req.usuario.id, req.body.password_actual, req.body.password_nueva))),

  // Compatibilidad (pantalla de Anotadores)
  listarAnotadores: envolver(async (req, res) => res.json(await svc.listarAnotadores())),
  crearAnotador:    envolver(async (req, res) => res.status(201).json(await svc.crearAnotador(req.body))),
  actualizarEquipo: envolver(async (req, res) => res.json(await svc.actualizarEquipo(req.params.id, req.body.equipo_inscrito_id))),
  cambiarPassword:  envolver(async (req, res) => res.json(await svc.resetPassword(req.params.id, req.body.password))),
};