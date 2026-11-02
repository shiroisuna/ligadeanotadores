const pool = require('../config/db');

// Igual que estFildeoModel, pero sin 'P' — los lanzadores no entran en el
// ranking defensivo por posición (tienen su propia sección de Lanzamientos).
const POSICIONES = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

const ETIQUETAS_POSICION = {
  'C':  '2.RECEPTOR',
  '1B': '3.1RA BASE',
  '2B': '4.2DA BASE',
  '3B': '5.3RA BASE',
  'SS': '6.CAMPO CORTO',
  'LF': '7.JARDINERO IZQUIERDO',
  'CF': '8.JARDINERO CENTRAL',
  'RF': '9.JARDINERO DERECHO',
};

function aved(o, a, e) {
  const total = (o || 0) + (a || 0) + (e || 0);
  if (!total) return 0;
  return Math.round(((o + a) / total) * 1000) / 1000;
}

const reglas = require('../config/ReglasLiderato');
const { comparador } = reglas;
const N = (v) => Number(v) || 0;

// Trae, para cada jugador que jugó fildeo en la categoría, su acumulado
// por posición (todas sus filas de esa posición a lo largo de la temporada).
async function obtenerAcumuladoPorPosicion(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT r.id AS roster_id, ef.posicion,
            j.nombres, j.apellidos, r.numero_camiseta, eq.nombre AS equipo, eq.logo_url AS logo_url,
            ei.id AS equipo_inscrito_id, ei.grupo AS grupo,
            SUM(ef.ij) AS ij, SUM(ef.o) AS o, SUM(ef.a) AS a, SUM(ef.e) AS e,
            SUM(ef.o + ef.a + ef.e) AS tl, SUM(ef.dp) AS dp,
            SUM(ef.pb) AS pb, SUM(ef.or_) AS atrapados_robando
     FROM est_fildeo ef
     JOIN roster r ON r.id = ef.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE ei.temporada_categoria_id = ? AND ef.posicion <> 'P'
     GROUP BY r.id, ef.posicion, j.nombres, j.apellidos, r.numero_camiseta,
              eq.nombre, eq.logo_url, ei.id, ei.grupo`,
    [temporada_categoria_id]
  );
  return rows;
}

async function juegosPorEquipo(temporada_categoria_id) {
  const [rows] = await pool.execute(
    'SELECT equipo_inscrito_id, jj FROM vw_tabla_posiciones WHERE temporada_categoria_id = ?',
    [temporada_categoria_id]
  );
  const mapa = {};
  rows.forEach((r) => { mapa[r.equipo_inscrito_id] = N(r.jj); });
  return mapa;
}

// Junta varias posiciones de un mismo jugador (para "Líder infielders / outfielders")
function combinarPorJugador(filas) {
  const porRoster = {};
  for (const f of filas) {
    const k = f.roster_id;
    if (!porRoster[k]) {
      porRoster[k] = { ...f, ij: 0, o: 0, a: 0, e: 0, tl: 0, dp: 0, pb: 0, atrapados_robando: 0 };
    }
    ['ij', 'o', 'a', 'e', 'tl', 'dp', 'pb', 'atrapados_robando'].forEach((c) => { porRoster[k][c] += N(f[c]); });
  }
  return Object.values(porRoster);
}

// Reglamento 21.03 — Empates defensivos: mayor AVED → más lances totales → más entradas
// jugadas → y luego, según la posición:
//   Receptores:  más asistencias, más atrapados robando, menos pasbols, más doble plays
//   Inicialistas y jardineros: más outs, más asistencias, más doble plays
//   Jugadores de cuadro (2B, 3B, SS): más asistencias, más outs, más doble plays
function criteriosFildeo(clave) {
  const base = [[(r) => r.aved, 'desc'], [(r) => r.tl, 'desc'], [(r) => r.ij, 'desc']];
  if (clave === 'C') {
    return [...base, [(r) => r.a, 'desc'], [(r) => r.atrapados_robando, 'desc'], [(r) => r.pb, 'asc'], [(r) => r.dp, 'desc']];
  }
  if (['1B', 'LF', 'CF', 'RF', 'OF'].includes(clave)) {
    return [...base, [(r) => r.o, 'desc'], [(r) => r.a, 'desc'], [(r) => r.dp, 'desc']];
  }
  return [...base, [(r) => r.a, 'desc'], [(r) => r.o, 'desc'], [(r) => r.dp, 'desc']];
}

function armarGrupo(jugadores, clave, juegosEq, limit) {
  const porJuego = reglas.ijPorJuego(clave === 'C' ? 'C' : 'otras');
  const califican = jugadores
    .map((j) => {
      const minimo = Math.round(porJuego * (juegosEq[j.equipo_inscrito_id] || 0) * 10) / 10;
      return {
        roster_id: j.roster_id, nombres: j.nombres, apellidos: j.apellidos,
        numero_camiseta: j.numero_camiseta,
        equipo: j.equipo, logo_url: j.logo_url, equipo_inscrito_id: j.equipo_inscrito_id,
        ij: N(j.ij), o: N(j.o), a: N(j.a), e: N(j.e), tl: N(j.o) + N(j.a) + N(j.e),
        dp: N(j.dp), pb: N(j.pb), atrapados_robando: N(j.atrapados_robando),
        aved: aved(N(j.o), N(j.a), N(j.e)),
        minimo_ij: minimo,
      };
    })
    .filter((j) => j.ij > 0 && j.ij >= j.minimo_ij)
    .sort(comparador(criteriosFildeo(clave)))
    .slice(0, limit);

  return { minimo_por_juego: porJuego, jugadores: califican };
}

// Top por posición. Mínimo reglamentario: innings jugados a la defensiva ≥
// (juegos del equipo × 3.0 receptor / 4.0 otras posiciones). Se calcula POR GRUPO
// solo para presentar (si los equipos no tienen grupo todos caen en "General").
async function lideresDefensiva(temporada_categoria_id, limit = 10) {
  const [filas, juegosEq] = await Promise.all([
    obtenerAcumuladoPorPosicion(temporada_categoria_id),
    juegosPorEquipo(temporada_categoria_id),
  ]);

  const BLOQUES = [
    ...POSICIONES.map((p) => ({ clave: p, etiqueta: ETIQUETAS_POSICION[p], posiciones: [p] })),
    { clave: 'IF', etiqueta: 'LÍDER INFIELDERS (2B, 3B, SS)', posiciones: ['2B', '3B', 'SS'] },
    { clave: 'OF', etiqueta: 'LÍDER OUTFIELDERS (LF, CF, RF)', posiciones: ['LF', 'CF', 'RF'] },
  ];

  const resultado = [];
  for (const bloque of BLOQUES) {
    let deEsteBloque = filas.filter((f) => bloque.posiciones.includes(f.posicion));
    if (bloque.posiciones.length > 1) deEsteBloque = combinarPorJugador(deEsteBloque);

    const porGrupo = {};
    for (const j of deEsteBloque) {
      const g = j.grupo || 'General';
      if (!porGrupo[g]) porGrupo[g] = [];
      porGrupo[g].push(j);
    }
    const grupos = Object.keys(porGrupo).sort().map((grupo) => ({
      grupo,
      ...armarGrupo(porGrupo[grupo], bloque.clave, juegosEq, limit),
    }));
    resultado.push({ posicion: bloque.clave, etiqueta: bloque.etiqueta, grupos });
  }
  return resultado;
}

module.exports = { POSICIONES, ETIQUETAS_POSICION, lideresDefensiva };