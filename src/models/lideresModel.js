const pool = require('../config/db');

// stat -> { columna real en la vista, dirección del ORDER BY }
const STATS_BATEO = {
  hits: { columna: 'hits', direccion: 'DESC' },
  dobles: { columna: 'dobles', direccion: 'DESC' },
  triples: { columna: 'triples', direccion: 'DESC' },
  jonrones: { columna: 'jonrones', direccion: 'DESC' },
  carreras_anotadas: { columna: 'carreras_anotadas', direccion: 'DESC' },
  carreras_impulsadas: { columna: 'carreras_impulsadas', direccion: 'DESC' },
  bases_robadas: { columna: 'bases_robadas', direccion: 'DESC' },
  promedio_bateo: { columna: 'promedio_bateo', direccion: 'DESC' },
  slugging: { columna: 'slugging', direccion: 'DESC' },
};

const STATS_PITCHEO = {
  ganados: { columna: 'ganados', direccion: 'DESC' },
  salvados: { columna: 'salvados', direccion: 'DESC' },
  ponches: { columna: 'ponches', direccion: 'DESC' },
  innings_lanzados: { columna: 'innings_lanzados', direccion: 'DESC' },
  efectividad: { columna: 'efectividad', direccion: 'ASC' }, // menor efectividad = mejor
};

function limiteSeguro(limit) {
  const n = Number.parseInt(limit, 10);
  if (!Number.isFinite(n) || n <= 0) return 10;
  return Math.min(n, 100);
}

async function lideresBateo(temporada_categoria_id, stat, posicion, limit) {
  const def = STATS_BATEO[stat];
  const condiciones = ['temporada_categoria_id = ?'];
  const valores = [temporada_categoria_id];

  if (posicion) {
    condiciones.push('posicion_principal = ?');
    valores.push(posicion);
  }

  const sql = `SELECT * FROM vw_bateo_acumulado
               WHERE ${condiciones.join(' AND ')}
               ORDER BY ${def.columna} ${def.direccion}
               LIMIT ${limiteSeguro(limit)}`;
  const [rows] = await pool.execute(sql, valores);
  return rows;
}

async function lideresPitcheo(temporada_categoria_id, stat, limit) {
  const def = STATS_PITCHEO[stat];
  const sql = `SELECT * FROM vw_pitcheo_acumulado
               WHERE temporada_categoria_id = ?
               ORDER BY ${def.columna} ${def.direccion}
               LIMIT ${limiteSeguro(limit)}`;
  const [rows] = await pool.execute(sql, [temporada_categoria_id]);
  return rows;
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
  STATS_BATEO, STATS_PITCHEO, lideresBateo, lideresPitcheo,
  estadisticasBateoPorEquipo, estadisticasPitcheoPorEquipo, estadisticasFildeoPorEquipo,
  estadisticasPorJugador, historialBateoPorRoster, historialPitcheoPorRoster,
};