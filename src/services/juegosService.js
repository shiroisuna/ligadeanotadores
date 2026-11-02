const juegosModel = require('../models/juegosModel');
const anotadorJuegosModel = require('../models/anotadorJuegosModel');
const { validarAnotadorJuego } = require('./permisosJuegoService');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

function sinPermiso(mensaje) {
  const err = new Error(mensaje);
  err.status = 403;
  return err;
}

async function listar(filtros) {
  return juegosModel.listar(filtros);
}

async function obtener(id) {
  const juego = await juegosModel.obtenerPorId(id);
  if (!juego) throw noEncontrado('Juego no encontrado');
  return juego;
}

async function crear(datos) {
  const requeridos = ['temporada_categoria_id', 'equipo_local_id', 'equipo_visitante_id', 'fecha'];
  for (const campo of requeridos) {
    if (!datos[campo]) {
      const err = new Error(`${campo} es requerido`);
      err.status = 400;
      throw err;
    }
  }
  if (datos.equipo_local_id === datos.equipo_visitante_id) {
    const err = new Error('El equipo local y visitante no pueden ser el mismo');
    err.status = 400;
    throw err;
  }
  return juegosModel.crear(datos);
}

async function actualizar(id, datos, usuario) {
  const juego = await obtener(id);
  await validarAnotadorJuego(juego, usuario);
  return juegosModel.actualizar(id, datos);
}

async function eliminar(id) {
  await obtener(id);
  return juegosModel.eliminar(id);
}

// ---- entradas ----

async function listarEntradas(juego_id) {
  await obtener(juego_id);
  return juegosModel.listarEntradas(juego_id);
}

async function guardarEntradas(juego_id, entradas, usuario) {
  const juego = await obtener(juego_id);
  await validarAnotadorJuego(juego, usuario);
  if (!Array.isArray(entradas) || !entradas.length) {
    const err = new Error('entradas debe ser un arreglo con al menos un elemento');
    err.status = 400;
    throw err;
  }
  return juegosModel.guardarEntradas(juego_id, entradas);
}

// ---- asignación de anotadores por juego (solo administrador) ----
async function listarAnotadoresDeJuego(juego_id) {
  await obtener(juego_id);
  const [asignados, disponibles] = await Promise.all([
    anotadorJuegosModel.listarPorJuego(juego_id),
    anotadorJuegosModel.usuariosAnotadoresActivos(),
  ]);
  return { asignados, disponibles };
}

async function asignarAnotadores(juego_id, usuario_ids) {
  await obtener(juego_id);
  if (!Array.isArray(usuario_ids)) {
    const err = new Error('usuario_ids debe ser un arreglo'); err.status = 400; throw err;
  }
  const validos = new Set((await anotadorJuegosModel.usuariosAnotadoresActivos()).map((u) => u.id));
  const limpios = [...new Set(usuario_ids.map(Number))].filter((id) => validos.has(id));
  await anotadorJuegosModel.reemplazarPorJuego(juego_id, limpios);
  return { ok: true, asignados: limpios.length };
}

async function misJuegosAsignados(usuario) {
  return anotadorJuegosModel.juegosDeUsuario(usuario.id);
}

module.exports = { listarAnotadoresDeJuego, asignarAnotadores, misJuegosAsignados, listar, obtener, crear, actualizar, eliminar, listarEntradas, guardarEntradas };
