const pool = require('../config/db');

const reglas = require('../config/ReglasLiderato');
const { comparador } = reglas;

// stat -> definición. 'promedio' = estadística de promedio (exige mínimo reglamentario)
const STATS_BATEO = {
  hits: { tipo: 'conteo', columna: 'hits' },
  dobles: { tipo: 'conteo', columna: 'dobles' },
  triples: { tipo: 'conteo', columna: 'triples' },
  jonrones: { tipo: 'conteo', columna: 'jonrones' },
  carreras_anotadas: { tipo: 'conteo', columna: 'carreras_anotadas' },
  carreras_impulsadas: { tipo: 'conteo', columna: 'carreras_impulsadas' },
  bases_por_bolas: { tipo: 'conteo', columna: 'bases_por_bolas' },
  bases_robadas: { tipo: 'robadas', columna: 'bases_robadas' },
  promedio_bateo: { tipo: 'promedio', columna: 'promedio_bateo' },
  slugging: { tipo: 'promedio', columna: 'slugging' },
};

const STATS_PITCHEO = {
  ganados: { tipo: 'ganados' },
  salvados: { tipo: 'salvados' },
  ponches: { tipo: 'ponches' },
  innings_lanzados: { tipo: 'innings' },
  efectividad: { tipo: 'efectividad', promedio: true },       // menor = mejor
  promedio_ganados: { tipo: 'promedio_ganados', promedio: true },
};

function limiteSeguro(limit) {
  const n = Number.parseInt(limit, 10);
  if (!Number.isFinite(n) || n <= 0) return 10;
  return Math.min(n, 100);
}

const N = (v) => Number(v) || 0;

// Innings por juego (num_innings) y juegos realizados por cada equipo de la categoría.
async function contextoCategoria(temporada_categoria_id) {
  const [cat] = await pool.execute(
    `SELECT c.num_innings
     FROM temporada_categoria tc JOIN categorias c ON c.id = tc.categoria_id
     WHERE tc.id = ?`,
    [temporada_categoria_id]
  );
  const [juegos] = await pool.execute(
    'SELECT equipo_inscrito_id, jj FROM vw_tabla_posiciones WHERE temporada_categoria_id = ?',
    [temporada_categoria_id]
  );
  const juegosPorEquipo = {};
  juegos.forEach((j) => { juegosPorEquipo[j.equipo_inscrito_id] = N(j.jj); });
  return { numInnings: N(cat[0] && cat[0].num_innings) || 7, juegosPorEquipo };
}

// Reglas vigentes (para mostrarlas en pantalla)
async function reglasDeCategoria(temporada_categoria_id) {
  const { numInnings } = await contextoCategoria(temporada_categoria_id);
  return {
    num_innings: numInnings,
    bateo_al_por_juego: reglas.alPorJuego(numInnings),
    pitcheo_il_por_juego: reglas.ilPorJuego(numInnings),
    defensa_ij_por_juego: reglas.DEFENSA_IJ_POR_JUEGO,
  };
}

// ── Criterios de desempate (Reglamento 21.03) ────────────────────────
const tb = (r) => N(r.hits) + N(r.dobles) + 2 * N(r.triples) + 3 * N(r.jonrones);
const obp = (r) => {
  const den = N(r.vb) + N(r.bases_por_bolas) + N(r.golpeado_pitcher) + N(r.sacrifice_fly);
  return den ? (N(r.hits) + N(r.bases_por_bolas) + N(r.golpeado_pitcher)) / den : 0;
};
const slg = (r) => (N(r.vb) ? tb(r) / N(r.vb) : 0);

function criteriosBateo(def) {
  const juegos = (r) => r.juegos_jugados;
  if (def.tipo === 'promedio' && def.columna === 'promedio_bateo') {
    // Bateo: 1 más VB, 2 más hits, 3 más AL, 4 mayor % embasado, 5 mayor slugging, 6 más juegos
    return [[(r) => r.promedio_bateo, 'desc'], [(r) => r.vb, 'desc'], [(r) => r.hits, 'desc'],
      [(r) => r.al, 'desc'], [obp, 'desc'], [slg, 'desc'], [juegos, 'desc']];
  }
  if (def.tipo === 'promedio') {
    // Slugging: 1 más bases alcanzadas, 2 más VB, 3 HR, 4 triples, 5 dobles, 6 hits, 7 AL, 8 juegos
    return [[(r) => r.slugging, 'desc'], [tb, 'desc'], [(r) => r.vb, 'desc'], [(r) => r.jonrones, 'desc'],
      [(r) => r.triples, 'desc'], [(r) => r.dobles, 'desc'], [(r) => r.hits, 'desc'],
      [(r) => r.al, 'desc'], [juegos, 'desc']];
  }
  if (def.tipo === 'robadas') {
    // BR: 1 menos intentos de robo, 2 menos AL, 3 menos VB, 4 menos veces embasado, 5 menos juegos
    return [[(r) => r.bases_robadas, 'desc'], [(r) => N(r.bases_robadas) + N(r.outs_robando), 'asc'],
      [(r) => r.al, 'asc'], [(r) => r.vb, 'asc'],
      [(r) => N(r.hits) + N(r.bases_por_bolas) + N(r.golpeado_pitcher), 'asc'], [juegos, 'asc']];
  }
  // HR, 3B, 2B, H, CI, CA: 1 menos VB, 2 menos AL, 3 menos AL (restando BB y GP), 4 menos juegos
  return [[(r) => r[def.columna], 'desc'], [(r) => r.vb, 'asc'], [(r) => r.al, 'asc'],
    [(r) => N(r.al) - N(r.bases_por_bolas) - N(r.golpeado_pitcher), 'asc'], [juegos, 'asc']];
}

const efe = (r) => (N(r.innings_lanzados) ? (N(r.carreras_limpias) * r.num_innings) / N(r.innings_lanzados) : 999);
const avgG = (r) => (N(r.ganados) + N(r.perdidos) ? N(r.ganados) / (N(r.ganados) + N(r.perdidos)) : 0);

function criteriosPitcheo(def) {
  const jl = (r) => r.juegos_lanzados;
  switch (def.tipo) {
    case 'efectividad':
      // 1 más IL, 2 más juegos lanzados, 3 menos CL, 4 menor average de contrarios, 5 menos hits,
      // 6 menos BB, 7 más SO, 8 menos GP, 9 menos WP
      return [[efe, 'asc'], [(r) => r.innings_lanzados, 'desc'], [jl, 'desc'], [(r) => r.carreras_limpias, 'asc'],
        [(r) => (N(r.vb_enfrentados) ? N(r.hits_permitidos) / N(r.vb_enfrentados) : 0), 'asc'],
        [(r) => r.hits_permitidos, 'asc'], [(r) => r.bases_por_bolas, 'asc'], [(r) => r.ponches, 'desc'],
        [(r) => r.golpeados, 'asc'], [(r) => r.wild_pitchs, 'asc']];
    case 'promedio_ganados':
      // 1 más ganados, 2 menos juegos lanzados, (3 menos aperturas: sin dato), 4 más IL, 5 menor EFE, 6 menos hits
      return [[avgG, 'desc'], [(r) => r.ganados, 'desc'], [jl, 'asc'], [(r) => r.innings_lanzados, 'desc'],
        [efe, 'asc'], [(r) => r.hits_permitidos, 'asc']];
    case 'ganados':
      // 1 menos juegos lanzados, (2 menos aperturas: sin dato), 3 más IL, 4 menor EFE, 5 menos hits
      return [[(r) => r.ganados, 'desc'], [jl, 'asc'], [(r) => r.innings_lanzados, 'desc'], [efe, 'asc'],
        [(r) => r.hits_permitidos, 'asc']];
    case 'ponches':
      // 1 menos bateadores enfrentados, 2 menos IL, 3 menos juegos lanzados
      return [[(r) => r.ponches, 'desc'], [(r) => r.vb_enfrentados, 'asc'], [(r) => r.innings_lanzados, 'asc'], [jl, 'asc']];
    case 'salvados':
      // (1 menos oportunidades desperdiciadas y 2 menos apariciones como relevista: sin dato), 3 menos juegos lanzados
      return [[(r) => r.salvados, 'desc'], [jl, 'asc']];
    default: // innings
      return [[(r) => r.innings_lanzados, 'desc'], [jl, 'asc']];
  }
}

async function lideresBateo(temporada_categoria_id, stat, posicion, limit) {
  const def = STATS_BATEO[stat];
  const condiciones = ['temporada_categoria_id = ?'];
  const valores = [temporada_categoria_id];
  if (posicion) { condiciones.push('posicion_principal = ?'); valores.push(posicion); }

  const [rows] = await pool.execute(
    `SELECT * FROM vw_bateo_acumulado WHERE ${condiciones.join(' AND ')}`, valores
  );
  const { numInnings, juegosPorEquipo } = await contextoCategoria(temporada_categoria_id);
  const alPorJuego = reglas.alPorJuego(numInnings);

  let filas = rows.map((r) => {
    const juegosEquipo = juegosPorEquipo[r.equipo_inscrito_id] || 0;
    return { ...r, juegos_equipo: juegosEquipo, minimo_al: Math.round(alPorJuego * juegosEquipo * 10) / 10 };
  });
  if (def.tipo === 'promedio') {
    filas = filas.filter((r) => N(r.vb) > 0 && N(r.al) >= r.minimo_al);   // apariciones legales mínimas
  } else {
    filas = filas.filter((r) => N(r[def.columna]) > 0);
  }
  return filas.sort(comparador(criteriosBateo(def))).slice(0, limiteSeguro(limit));
}

async function lideresPitcheo(temporada_categoria_id, stat, limit) {
  const def = STATS_PITCHEO[stat];
  const [rows] = await pool.execute(
    `SELECT r.id AS roster_id, jg.nombres, jg.apellidos, jg.foto_url,
            ei.temporada_categoria_id, ei.id AS equipo_inscrito_id,
            eq.nombre AS equipo, eq.logo_url,
            SUM(ep.g) AS ganados, SUM(ep.p) AS perdidos, SUM(ep.s) AS salvados,
            SUM(ep.il) AS innings_lanzados, SUM(ep.so) AS ponches, SUM(ep.cl) AS carreras_limpias,
            SUM(ep.vb) AS vb_enfrentados, SUM(ep.hp) AS hits_permitidos, SUM(ep.bb) AS bases_por_bolas,
            SUM(ep.gp) AS golpeados, SUM(ep.wp) AS wild_pitchs,
            COUNT(DISTINCT ep.juego_id) AS juegos_lanzados
     FROM est_pitcheo ep
     JOIN roster r ON r.id = ep.roster_id
     JOIN jugadores jg ON jg.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE ep.aprobado = 1 AND ei.temporada_categoria_id = ?
     GROUP BY r.id, jg.nombres, jg.apellidos, jg.foto_url, ei.temporada_categoria_id,
              ei.id, eq.nombre, eq.logo_url`,
    [temporada_categoria_id]
  );
  const { numInnings, juegosPorEquipo } = await contextoCategoria(temporada_categoria_id);
  const ilPorJuego = reglas.ilPorJuego(numInnings);

  let filas = rows.map((r) => {
    const juegosEquipo = juegosPorEquipo[r.equipo_inscrito_id] || 0;
    const il = N(r.innings_lanzados);
    return {
      ...r,
      num_innings: numInnings,
      juegos_equipo: juegosEquipo,
      minimo_il: Math.round(ilPorJuego * juegosEquipo * 10) / 10,
      // Efectividad = CL × innings reglamentarios del juego ÷ IL
      efectividad: il ? Math.round((N(r.carreras_limpias) * numInnings / il) * 1000) / 1000 : null,
      // Average de juegos ganados y perdidos, en milésimas (1000 = 1.000)
      promedio_ganados: N(r.ganados) + N(r.perdidos) ? Math.round((N(r.ganados) / (N(r.ganados) + N(r.perdidos))) * 1000) : null,
    };
  });
  if (def.promedio) {
    filas = filas.filter((r) => N(r.innings_lanzados) > 0 && N(r.innings_lanzados) >= r.minimo_il);
    if (def.tipo === 'promedio_ganados') filas = filas.filter((r) => N(r.ganados) + N(r.perdidos) > 0);
  } else if (def.tipo === 'ganados') filas = filas.filter((r) => N(r.ganados) > 0);
  else if (def.tipo === 'salvados') filas = filas.filter((r) => N(r.salvados) > 0);
  else if (def.tipo === 'ponches') filas = filas.filter((r) => N(r.ponches) > 0);

  return filas.sort(comparador(criteriosPitcheo(def))).slice(0, limiteSeguro(limit));
}

async function estadisticasBateoPorEquipo(temporada_categoria_id, equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT * FROM vw_bateo_acumulado
     WHERE temporada_categoria_id = ? AND equipo_inscrito_id = ?
     ORDER BY promedio_bateo DESC`,
    [temporada_categoria_id, equipo_inscrito_id]
  );
  return rows;
}

async function estadisticasPitcheoPorEquipo(temporada_categoria_id, equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT * FROM vw_pitcheo_acumulado
     WHERE temporada_categoria_id = ? AND equipo_inscrito_id = ?
     ORDER BY innings_lanzados DESC`,
    [temporada_categoria_id, equipo_inscrito_id]
  );
  return rows;
}

// ── Fildeo general por jugador (sumado entre TODAS las posiciones que
// jugó) — usado en "Reporte por equipo" sección Labor Defensiva.
async function estadisticasFildeoPorEquipo(equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT r.id AS roster_id, j.nombres, j.apellidos,
            SUM(ef.ij) AS ij, SUM(ef.o) AS outs, SUM(ef.a) AS asistencias, SUM(ef.e) AS errores
     FROM est_fildeo ef
     JOIN roster r ON r.id = ef.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE r.equipo_inscrito_id = ?
     GROUP BY r.id, j.nombres, j.apellidos`,
    [equipo_inscrito_id]
  );
  return rows.map((f) => {
    const outs = Number(f.outs) || 0, asist = Number(f.asistencias) || 0, err = Number(f.errores) || 0;
    const total = outs + asist + err;
    return {
      roster_id: f.roster_id, nombres: f.nombres, apellidos: f.apellidos,
      ij: Number(f.ij) || 0, outs, asistencias: asist, errores: err, total,
      aved: total ? Math.round(((outs + asist) / total) * 1000) / 1000 : 0,
    };
  });
}

// ── Historial juego por juego (para la ficha del jugador) ────────────
async function historialBateoPorRoster(roster_id, limit = 15) {
  const [rows] = await pool.execute(
    `SELECT j.fecha,
            CASE WHEN j.equipo_local_id = r.equipo_inscrito_id THEN evq.nombre ELSE elq.nombre END AS rival,
            eb.vb, eb.ca, eb.hc, eb.bb, eb.h2, eb.h3, eb.hr, eb.ci, eb.br, eb.so
     FROM est_bateo eb
     JOIN roster r ON r.id = eb.roster_id
     JOIN juegos j ON j.id = eb.juego_id
     JOIN equipos_inscritos el ON el.id = j.equipo_local_id
     JOIN equipos elq ON elq.id = el.equipo_id
     JOIN equipos_inscritos ev ON ev.id = j.equipo_visitante_id
     JOIN equipos evq ON evq.id = ev.equipo_id
     WHERE eb.roster_id = ?
     ORDER BY j.fecha DESC
     LIMIT ${limiteSeguro(limit)}`,
    [roster_id]
  );
  return rows;
}

async function historialPitcheoPorRoster(roster_id, limit = 15) {
  const [rows] = await pool.execute(
    `SELECT j.fecha,
            CASE WHEN j.equipo_local_id = r.equipo_inscrito_id THEN evq.nombre ELSE elq.nombre END AS rival,
            ep.i, ep.r, ep.c, ep.g, ep.p, ep.vb, ep.hp, ep.h2, ep.h3, ep.hr,
            ep.il, ep.cp, ep.cl, ep.so, ep.bb, ep.wp, ep.bk
     FROM est_pitcheo ep
     JOIN roster r ON r.id = ep.roster_id
     JOIN juegos j ON j.id = ep.juego_id
     JOIN equipos_inscritos el ON el.id = j.equipo_local_id
     JOIN equipos elq ON elq.id = el.equipo_id
     JOIN equipos_inscritos ev ON ev.id = j.equipo_visitante_id
     JOIN equipos evq ON evq.id = ev.equipo_id
     WHERE ep.roster_id = ?
     ORDER BY j.fecha DESC
     LIMIT ${limiteSeguro(limit)}`,
    [roster_id]
  );
  return rows;
}

async function estadisticasPorJugador(roster_id) {
  const [bateo] = await pool.execute('SELECT * FROM vw_bateo_acumulado WHERE roster_id = ?', [roster_id]);
  const [pitcheo] = await pool.execute('SELECT * FROM vw_pitcheo_acumulado WHERE roster_id = ?', [roster_id]);
  const [roster] = await pool.execute(
    `SELECT r.numero_camiseta, j.foto_url
     FROM roster r JOIN jugadores j ON j.id = r.jugador_id
     WHERE r.id = ?`,
    [roster_id]
  );
  const [historialBateo, historialPitcheo] = await Promise.all([
    historialBateoPorRoster(roster_id),
    historialPitcheoPorRoster(roster_id),
  ]);
  return {
    numero_camiseta: roster[0] ? roster[0].numero_camiseta : null,
    foto_url: roster[0] ? roster[0].foto_url : null,
    bateo: bateo[0] || null,
    pitcheo: pitcheo[0] || null,
    historialBateo,
    historialPitcheo,
  };
}

module.exports = {
  STATS_BATEO, STATS_PITCHEO, lideresBateo, lideresPitcheo, reglasDeCategoria,
  estadisticasBateoPorEquipo, estadisticasPitcheoPorEquipo, estadisticasFildeoPorEquipo,
  estadisticasPorJugador, historialBateoPorRoster, historialPitcheoPorRoster,
};