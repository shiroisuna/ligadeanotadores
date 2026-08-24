const pool = require('../config/db');

const CAMPOS = [
  'vb','ca','hc','bb','sh','sf','gp','in_','al',
  'h2','h3','hr','ba','ci','br','or_','so'
];

async function obtenerPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT eb.*, j.nombres, j.apellidos, r.numero_camiseta, r.posicion_principal,
            eq.nombre AS equipo
     FROM est_bateo eb
     JOIN roster r ON r.id = eb.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE eb.juego_id = ?
     ORDER BY r.numero_camiseta`,
    [juego_id]
  );
  return rows;
}

// lineas = [{ roster_id, vb, ca, hc, ... }]
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
        `INSERT INTO est_bateo (${cols.join(',')}) VALUES (${placeholders})
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
    'DELETE FROM est_bateo WHERE juego_id = ? AND roster_id = ?',
    [juego_id, roster_id]
  );
}

module.exports = { CAMPOS, obtenerPorJuego, guardar, eliminar };
