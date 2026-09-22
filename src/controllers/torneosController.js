const svc = require('../services/torneosService');

const h = (fn) => async (req, res, next) => { try { res.json(await fn(req, res)); } catch (e) { next(e); } };

module.exports = {
  listar:         h((req) => svc.listar(req.query.temporada_categoria_id)),
  obtener:        h((req) => svc.obtener(req.params.id)),
  crear:          h((req) => svc.crear(req.body)),
  actualizar:     h((req) => svc.actualizar(req.params.id, req.body)),
  eliminar:       h(async (req, res) => { await svc.eliminar(req.params.id); res.status(204).end(); }),

  listarFases:    h((req) => svc.listarFases(req.params.torneoId)),
  crearFase:      h((req) => svc.crearFase(req.params.torneoId, req.body)),
  eliminarFase:   h(async (req, res) => { await svc.eliminarFase(req.params.faseId); res.status(204).end(); }),

  listarCruces:   h((req) => svc.listarCruces(req.params.torneoId)),
  crearCruce:     h((req) => svc.crearCruce(req.body)),
  actualizarCruce:h((req) => svc.actualizarCruce(req.params.cruceId, req.body)),
  eliminarCruce:  h(async (req, res) => { await svc.eliminarCruce(req.params.cruceId); res.status(204).end(); }),
};
