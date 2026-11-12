const posicionesModel = require('../models/posicionesModel');

const N = (v) => Number(v) || 0;

// Misma clasificación que usa el frontend (useTemporadaCategoria.clasificarRama)
function clasificarRama(disciplinaNombre = '') {
  const d = String(disciplinaNombre || '').toLowerCase().trim();
  if (d.includes('softbol') || d.includes('sóftbol')) return 'softbol';
  if (d.includes('mayor')) return 'mayor';
  return 'menor';
}

// Puntos que obtiene `a` jugando solo contra los equipos de `ids`
// (3 por juego ganado, 1 por empate — igual que la columna PTOS).
function puntosEntreSi(a, ids, juegos) {
  let pts = 0;
  for (const j of juegos) {
    const local = Number(j.equipo_local_id), visit = Number(j.equipo_visitante_id);
    if (!(ids.has(local) && ids.has(visit))) continue;
    if (local !== a && visit !== a) continue;
    let ganador = null;
    if (j.estado === 'jugado') {
      const cl = N(j.carreras_local), cv = N(j.carreras_visitante);
      if (cl === cv) { pts += 1; continue; }
      ganador = cl > cv ? local : visit;
    } else {
      ganador = Number(j.equipo_ganador_id);
    }
    if (ganador === a) pts += 3;
  }
  return pts;
}

// Béisbol Menor y Softbol:
//   1) Más puntos.
//   2) Si hay empate entre 2 o más equipos: confrontación directa entre ellos
//      (quién le ganó a quién).
//   3) Si persiste el empate: mayor balance de calidad (BCE).
//   4) Último recurso: mayor cantidad de carreras anotadas.
function ordenarMenorSoftbol(filasGrupo, juegos) {
  const porPuntos = [...filasGrupo].sort((a, b) => N(b.ptos) - N(a.ptos));
  const resultado = [];
  let i = 0;
  while (i < porPuntos.length) {
    let j = i + 1;
    while (j < porPuntos.length && N(porPuntos[j].ptos) === N(porPuntos[i].ptos)) j++;
    const empatados = porPuntos.slice(i, j);
    if (empatados.length > 1) {
      const ids = new Set(empatados.map((e) => Number(e.equipo_inscrito_id)));
      empatados.forEach((e) => { e._h2h = puntosEntreSi(Number(e.equipo_inscrito_id), ids, juegos); });
      empatados.sort((a, b) =>
        (b._h2h - a._h2h)
        || ((a.bce === null) - (b.bce === null))
        || (N(b.bce) - N(a.bce))
        || (N(b.carreras_anotadas) - N(a.carreras_anotadas)));
      empatados.forEach((e) => { delete e._h2h; });
    }
    resultado.push(...empatados);
    i = j;
  }
  return resultado;
}

async function obtener(temporada_categoria_id, fase) {
  fase = fase || 'eliminatoria';
  require('./fasesService').validarFase(fase);
  if (!temporada_categoria_id) {
    const err = new Error('temporada_categoria_id es requerido');
    err.status = 400;
    throw err;
  }
  const filas = await posicionesModel.obtener(temporada_categoria_id, fase);
  const rama = clasificarRama(await posicionesModel.disciplinaDeCategoria(temporada_categoria_id));
  if (rama === 'mayor') return filas;   // Béisbol Mayor: criterio propio (no aplica confrontación directa)

  const juegos = await posicionesModel.juegosAprobados(temporada_categoria_id, fase);
  const grupos = {};
  for (const f of filas) {
    const g = f.grupo || '';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(f);
  }
  return Object.keys(grupos).sort().flatMap((g) => ordenarMenorSoftbol(grupos[g], juegos));
}

module.exports = { obtener, ordenarMenorSoftbol, clasificarRama };
