const pool = require('../config/db');

const CAMPOS = [
  'g','p','s','e','i','r','c','b',
  'vb','hp','h2','h3','hr','il','cp','cl',
  'so','bb','bi','sh','sf','gp','wp','bk','li'
];

async function obtenerPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT ep.*, j.nombres, j.apellidos, r.numero_camiseta,
            eq.nombre AS equipo
     FROM est_pitcheo ep
     JOIN roster r ON r.id = ep.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE ep.juego_id = ?
     ORDER BY ep.il DESC`,
    [juego_id]
  );
  return rows;
}

async function guardar(juego_id, lineas) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const linea of lineas) {
      const cols = ['juego_id', 'roster_id', ...CAMPOS];
      const vals = [juego_id, linea.roster_id, ...CAMPOS.map((c) => linea[c] ?? 0)];
      const placeholders = cols.map(() => '?').join(', ');
      const updates = CAMPOS.map((c) => `${c} = VALUES(${c})`).join(', ');
      await conn.execute(
        `INSERT INTO est_pitcheo (${cols.join(',')}) VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${updates}`,
        vals
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return obtenerPorJuego(juego_id);
}

async function eliminar(juego_id, roster_id) {
  await pool.execute(
    'DELETE FROM est_pitcheo WHERE juego_id = ? AND roster_id = ?',
    [juego_id, roster_id]
  );
}

module.exports = { CAMPOS, obtenerPorJuego, guardar, eliminar };
