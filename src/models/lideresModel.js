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

async function estadisticasPorJugador(roster_id) {
  const [bateo] = await pool.execute('SELECT * FROM vw_bateo_acumulado WHERE roster_id = ?', [roster_id]);
  const [pitcheo] = await pool.execute('SELECT * FROM vw_pitcheo_acumulado WHERE roster_id = ?', [roster_id]);
  const [roster] = await pool.execute(
    `SELECT r.numero_camiseta, j.foto_url
     FROM roster r JOIN jugadores j ON j.id = r.jugador_id
     WHERE r.id = ?`,
    [roster_id]
  );
  return {
    numero_camiseta: roster[0] ? roster[0].numero_camiseta : null,
    foto_url: roster[0] ? roster[0].foto_url : null,
    bateo: bateo[0] || null,
    pitcheo: pitcheo[0] || null,
  };
}

module.exports = {
  STATS_BATEO, STATS_PITCHEO, lideresBateo, lideresPitcheo,
  estadisticasBateoPorEquipo, estadisticasPitcheoPorEquipo, estadisticasPorJugador,
};
