const jugadoresService = require('../services/jugadoresService');

async function listar(req, res, next) {
  try { res.json(await jugadoresService.listar()); } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try { res.json(await jugadoresService.obtener(req.params.id)); } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try { res.status(201).json(await jugadoresService.crear(req.body)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try { res.json(await jugadoresService.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try { await jugadoresService.eliminar(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

// ---- roster ----

async function listarRoster(req, res, next) {
  try {
    res.json(await jugadoresService.listarRosterPorEquipo(req.query.equipo_inscrito_id));
  } catch (err) { next(err); }
}

async function agregarARoster(req, res, next) {
  try { res.status(201).json(await jugadoresService.agregarARoster(req.body)); } catch (err) { next(err); }
}

async function actualizarRoster(req, res, next) {
  try {
    res.json(await jugadoresService.actualizarRoster(req.params.id, req.body));
  } catch (err) { next(err); }
}

async function eliminarDeRoster(req, res, next) {
  try {
    await jugadoresService.eliminarDeRoster(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

// El jugador_id sale del token (req.usuario), nunca de la URL — así un
// jugador no puede pedir el perfil de otro cambiando un parámetro.
async function miPerfil(req, res, next) {
  try {
    res.json(await jugadoresService.misEquipos(req.usuario.jugador_id));
  } catch (err) { next(err); }
}

async function perfilContacto(req, res, next) {
  try {
    res.json(await jugadoresService.perfilContacto(req.params.roster_id, req.usuario));
  } catch (err) { next(err); }
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarRoster, agregarARoster, actualizarRoster, eliminarDeRoster,
  miPerfil, perfilContacto,
};
