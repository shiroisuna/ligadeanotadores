const fasesModel = require('../models/fasesModel');

const FASES = ['eliminatoria', 'concentrado', 'semifinal', 'final'];

function error400(msg) { const e = new Error(msg); e.status = 400; return e; }

function validarFase(fase) {
  if (!FASES.includes(fase)) throw error400(`Fase inválida. Use: ${FASES.join(', ')}`);
}

// Fases disponibles de una categoría: la eliminatoria siempre, y las demás si ya tienen equipos.
async function listar(temporada_categoria_id) {
  if (!temporada_categoria_id) throw error400('temporada_categoria_id es requerido');
  const con = await fasesModel.fasesConEquipos(temporada_categoria_id);
  const mapa = {};
  con.forEach((f) => { mapa[f.fase] = Number(f.equipos); });
  return FASES
    .filter((f) => f === 'eliminatoria' || mapa[f])
    .map((f) => ({ fase: f, equipos: mapa[f] ?? null }));
}

async function equipos(temporada_categoria_id, fase) {
  if (!temporada_categoria_id) throw error400('temporada_categoria_id es requerido');
  validarFase(fase || 'eliminatoria');
  return fasesModel.equiposDeFase(temporada_categoria_id, fase || 'eliminatoria');
}

// Define qué equipos (y en qué grupo) juegan una fase. Reemplaza la lista anterior.
async function guardarEquipos(temporada_categoria_id, fase, lista) {
  validarFase(fase);
  if (fase === 'eliminatoria') {
    throw error400('La eliminatoria usa los equipos inscritos; se configura en Equipos y roster');
  }
  if (!Array.isArray(lista)) throw error400('equipos debe ser una lista');

  const inscritos = new Set(await fasesModel.inscritosDeCategoria(temporada_categoria_id));
  const vistos = new Set();
  const limpia = [];
  for (const e of lista) {
    const id = Number(e.equipo_inscrito_id);
    if (!inscritos.has(id)) throw error400('Hay un equipo que no pertenece a esta categoría');
    if (vistos.has(id)) throw error400('Hay un equipo repetido');
    vistos.add(id);
    limpia.push({ equipo_inscrito_id: id, grupo: e.grupo ? String(e.grupo).trim().toUpperCase().slice(0, 10) : null });
  }

  const conJuegos = await fasesModel.equiposConJuegosEnFase(temporada_categoria_id, fase);
  const faltan = conJuegos.filter((id) => !vistos.has(id));
  if (faltan.length) {
    throw error400('No se puede quitar de la fase a equipos que ya tienen juegos registrados en ella');
  }

  await fasesModel.reemplazarEquipos(temporada_categoria_id, fase, limpia);
  return fasesModel.equiposDeFase(temporada_categoria_id, fase);
}

module.exports = { FASES, validarFase, listar, equipos, guardarEquipos };
