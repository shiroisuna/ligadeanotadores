const juegosModel = require('../models/juegosModel');
const anotadorJuegosModel = require('../models/anotadorJuegosModel');
const { validarAnotadorJuego } = require('./permisosJuegoService');
const fasesModel = require('../models/fasesModel');
const fasesService = require('./fasesService');

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
  const fase = datos.fase || 'eliminatoria';
  fasesService.validarFase(fase);
  if (fase !== 'eliminatoria') {
    for (const id of [datos.equipo_local_id, datos.equipo_visitante_id]) {
      if (!(await fasesModel.equipoEnFase(datos.temporada_categoria_id, fase, id))) {
        const err = new Error(`Ambos equipos deben estar asignados a la fase "${fase}" (Admin → Fases)`);
        err.status = 400;
        throw err;
      }
    }
  }
  return juegosModel.crear({ ...datos, fase });
}

function error400(mensaje) { const e = new Error(mensaje); e.status = 400; return e; }

// Cambios de programación (equipos, fase): solo administrador, y con validaciones.
async function validarCambiosProgramacion(juego, datos) {
  const nuevoLocal = Number(datos.equipo_local_id ?? juego.equipo_local_id);
  const nuevoVisit = Number(datos.equipo_visitante_id ?? juego.equipo_visitante_id);
  const nuevaFase = datos.fase ?? juego.fase ?? 'eliminatoria';
  const cambiaEquipos = nuevoLocal !== Number(juego.equipo_local_id) || nuevoVisit !== Number(juego.equipo_visitante_id);
  const cambiaFase = nuevaFase !== (juego.fase || 'eliminatoria');
  if (!cambiaEquipos && !cambiaFase) return;

  if (nuevoLocal === nuevoVisit) throw error400('El equipo local y visitante no pueden ser el mismo');
  fasesService.validarFase(nuevaFase);

  const inscritos = new Set(await fasesModel.inscritosDeCategoria(juego.temporada_categoria_id));
  if (!inscritos.has(nuevoLocal) || !inscritos.has(nuevoVisit)) {
    throw error400('Los equipos deben pertenecer a la categoría del juego');
  }
  if (nuevaFase !== 'eliminatoria') {
    for (const eq of [nuevoLocal, nuevoVisit]) {
      if (!(await fasesModel.equipoEnFase(juego.temporada_categoria_id, nuevaFase, eq))) {
        throw error400(`Ambos equipos deben estar asignados a la fase "${nuevaFase}" (Admin → Fases del torneo)`);
      }
    }
  }
  if (cambiaEquipos) {
    // Con estadísticas ya cargadas, cambiar los equipos dejaría datos de jugadores del equipo equivocado.
    const datosCargados = await juegosModel.contarDatos(juego.id);
    const total = Object.entries(datosCargados)
      .filter(([t]) => ['bateo_juego', 'pitcheo_juego', 'est_bateo', 'est_pitcheo', 'est_fildeo', 'entradas_juego'].includes(t))
      .reduce((a, [, n]) => a + n, 0);
    if (total > 0) {
      throw error400('Este juego ya tiene box score/estadísticas cargadas; no se pueden cambiar los equipos. Elimina el juego y créalo de nuevo, o corrige los datos sin cambiar equipos.');
    }
  }
}

async function actualizar(id, datos, usuario) {
  const juego = await obtener(id);
  await validarAnotadorJuego(juego, usuario);
  const copia = { ...datos };
  if (!usuario || usuario.rol !== 'administrador') {
    // El anotador carga resultados; no puede reprogramar ni cambiar equipos.
    delete copia.equipo_local_id; delete copia.equipo_visitante_id; delete copia.fase;
  } else {
    await validarCambiosProgramacion(juego, copia);
  }
  return juegosModel.actualizar(id, copia);
}

// Resumen de lo que se perdería al eliminar (para el aviso de confirmación).
async function resumenDatos(id) {
  await obtener(id);
  return juegosModel.contarDatos(id);
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

module.exports = { resumenDatos, listarAnotadoresDeJuego, asignarAnotadores, misJuegosAsignados, listar, obtener, crear, actualizar, eliminar, listarEntradas, guardarEntradas };
