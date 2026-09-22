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

// Trae, para cada jugador que jugó fildeo en la categoría, su acumulado
// de IJ/O/A/E/TL por posición (sumando todas sus filas de esa posición
// a lo largo de la temporada).
async function obtenerAcumuladoPorPosicion(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT r.id AS roster_id, ef.posicion,
            j.nombres, j.apellidos, eq.nombre AS equipo, eq.logo_url AS logo_url,
            SUM(ef.ij) AS ij, SUM(ef.o) AS o, SUM(ef.a) AS a, SUM(ef.e) AS e, SUM(ef.tl) AS tl
     FROM est_fildeo ef
     JOIN roster r ON r.id = ef.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE ei.temporada_categoria_id = ? AND ef.posicion <> 'P'
     GROUP BY r.id, ef.posicion, j.nombres, j.apellidos, eq.nombre, eq.logo_url`,
    [temporada_categoria_id]
  );
  return rows;
}

// Arma el top 10 (que califican) por cada posición, con el umbral de
// innings específico de esa posición: 2/3 del promedio de IJ de todos
// los jugadores que jugaron esa posición en la categoría.
async function lideresDefensiva(temporada_categoria_id, limit = 10) {
  const filas = await obtenerAcumuladoPorPosicion(temporada_categoria_id);

  // Agrupar por posición
  const porPosicion = {};
  for (const p of POSICIONES) porPosicion[p] = [];
  for (const f of filas) {
    if (porPosicion[f.posicion]) porPosicion[f.posicion].push(f);
  }

  const resultado = [];
  for (const posicion of POSICIONES) {
    const jugadores = porPosicion[posicion];
    if (!jugadores.length) {
      resultado.push({ posicion, etiqueta: ETIQUETAS_POSICION[posicion], media_ij: 0, umbral_ij: 0, jugadores: [] });
      continue;
    }

    const mediaIj = jugadores.reduce((acc, j) => acc + Number(j.ij || 0), 0) / jugadores.length;
    const umbral = Math.round((mediaIj * (2 / 3)) * 10) / 10;

    const califican = jugadores
      .filter((j) => Number(j.ij || 0) >= umbral)
      .map((j) => ({
        roster_id: j.roster_id,
        nombres: j.nombres,
        apellidos: j.apellidos,
        equipo: j.equipo,
        logo_url: j.logo_url,
        ij: Number(j.ij || 0),
        o: Number(j.o || 0),
        a: Number(j.a || 0),
        e: Number(j.e || 0),
        tl: Number(j.tl || 0),
        aved: aved(Number(j.o || 0), Number(j.a || 0), Number(j.e || 0)),
      }))
      .sort((a, b) => b.aved - a.aved)
      .slice(0, limit);

    resultado.push({
      posicion,
      etiqueta: ETIQUETAS_POSICION[posicion],
      media_ij: Math.round(mediaIj * 10) / 10,
      umbral_ij: umbral,
      jugadores: califican,
    });
  }
  return resultado;
}

module.exports = { POSICIONES, ETIQUETAS_POSICION, lideresDefensiva };