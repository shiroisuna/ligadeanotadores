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

module.exports = { STATS_BATEO, STATS_PITCHEO, lideresBateo, lideresPitcheo };
