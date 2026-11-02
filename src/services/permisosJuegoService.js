const anotadorJuegosModel = require('../models/anotadorJuegosModel');

function sinPermiso(msg) { const e = new Error(msg); e.status = 403; return e; }

// ¿Este anotador puede tocar ESTE juego?
//  1) el administrador siempre puede;
//  2) el anotador puede si el admin le asignó el juego específico;
//  3) (compatibilidad) si su usuario tiene equipo, puede en juegos de ese equipo.
// Devuelve 'admin' | 'asignado' | 'equipo' (o lanza 403).
async function validarAnotadorJuego(juego, usuario) {
  if (!usuario || usuario.rol !== 'anotador') return 'admin';
  if (await anotadorJuegosModel.tienePermiso(usuario.id, juego.id)) return 'asignado';
  const eq = usuario.equipo_inscrito_id;
  if (eq && (Number(juego.equipo_local_id) === Number(eq) || Number(juego.equipo_visitante_id) === Number(eq))) return 'equipo';
  throw sinPermiso('No tienes permiso para cargar datos de este juego. Pídele al administrador que te lo asigne.');
}

module.exports = { validarAnotadorJuego };
