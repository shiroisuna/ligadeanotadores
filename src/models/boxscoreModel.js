const pool = require('../config/db');

const CAMPOS_BATEO = [
  'posicion', 'vb', 'ca', 'hc', 'bb', 'sh', 'sf', 'gp', 'in_', 'al',
  'h2', 'h3', 'hr', 'ba', 'ci', 'br', 'or_', 'so', 'ij', 'o', 'a', 'e', 'tl', 'dp', 'di',
];

// Orden del box score físico: I, R, C, G, P, S, E, T.L, VB, HP, H2, H3, HR, IL, CP, CL, SO, BB, BI, SF, GP, WP, BK
const CAMPOS_PITCHEO = [
  'i', 'r', 'c', 'g', 'p', 's', 'e', 'tl', 'vb_enfrentados', 'hp', 'h2', 'h3', 'hr', 'il',
  'cp', 'cl', 'so', 'bb', 'bi', 'sf', 'gp', 'wp', 'bk',
];

async function obtenerBateoPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT bj.*, j.nombres, j.apellidos, r.numero_camiseta
     FROM bateo_juego bj
     JOIN roster r ON r.id = bj.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE bj.juego_id = ?
     ORDER BY r.numero_camiseta`,
    [juego_id]
  );
  return rows;
}

async function obtenerPitcheoPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT pj.*, j.nombres, j.apellidos, r.numero_camiseta
     FROM pitcheo_juego pj
     JOIN roster r ON r.id = pj.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE pj.juego_id = ?
     ORDER BY pj.id`,
    [juego_id]
  );
  return rows;
}

function armarUpsert(tabla, campos, juego_id, linea) {
  const columnas = ['juego_id', 'roster_id', ...campos];
  const valores = [juego_id, linea.roster_id, ...campos.map((c) => linea[c] ?? (c === 'posicion' ? null : 0))];
  const placeholders = columnas.map(() => '?').join(', ');
  const actualizaciones = campos.map((c) => `${c} = VALUES(${c})`).join(', ');

  return {
    sql: `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${placeholders})
          ON DUPLICATE KEY UPDATE ${actualizaciones}`,
    valores,
  };
}

async function guardarBateo(juego_id, lineas) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const linea of lineas) {
      const { sql, valores } = armarUpsert('bateo_juego', CAMPOS_BATEO, juego_id, linea);
      await conn.execute(sql, valores);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return obtenerBateoPorJuego(juego_id);
}

async function guardarPitcheo(juego_id, lineas) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const linea of lineas) {
      const { sql, valores } = armarUpsert('pitcheo_juego', CAMPOS_PITCHEO, juego_id, linea);
      await conn.execute(sql, valores);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return obtenerPitcheoPorJuego(juego_id);
}

async function eliminarBateo(id) {
  await pool.execute('DELETE FROM bateo_juego WHERE id = ?', [id]);
}

async function eliminarPitcheo(id) {
  await pool.execute('DELETE FROM pitcheo_juego WHERE id = ?', [id]);
}

async function juegoLlevaPitcheo(juego_id) {
  const [rows] = await pool.execute(
    `SELECT c.lleva_pitcheo
     FROM juegos j
     JOIN temporada_categoria tc ON tc.id = j.temporada_categoria_id
     JOIN categorias c ON c.id = tc.categoria_id
     WHERE j.id = ?`,
    [juego_id]
  );
  return rows[0] ? !!rows[0].lleva_pitcheo : false;
}

module.exports = {
  CAMPOS_BATEO, CAMPOS_PITCHEO,
  obtenerBateoPorJuego, obtenerPitcheoPorJuego,
  guardarBateo, guardarPitcheo,
  eliminarBateo, eliminarPitcheo,
  juegoLlevaPitcheo,
};