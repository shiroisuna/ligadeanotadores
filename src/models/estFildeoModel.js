const pool = require('../config/db');

const POSICIONES = ['P','C','1B','2B','3B','SS','LF','CF','RF'];
const CAMPOS = ['ij','o','a','e','tl','dp','di','pb','ir','or_'];

async function obtenerPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT ef.*, j.nombres, j.apellidos, r.numero_camiseta,
            eq.nombre AS equipo
     FROM est_fildeo ef
     JOIN roster r ON r.id = ef.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE ef.juego_id = ?
     ORDER BY r.numero_camiseta, ef.posicion`,
    [juego_id]
  );
  return rows;
}

// lineas = [{ roster_id, posicion, ij, o, a, e, ... }]
async function guardar(juego_id, lineas) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const linea of lineas) {
      const cols = ['juego_id', 'roster_id', 'posicion', ...CAMPOS];
      const vals = [juego_id, linea.roster_id, linea.posicion, ...CAMPOS.map((c) => linea[c] ?? 0)];
      const placeholders = cols.map(() => '?').join(', ');
      const updates = CAMPOS.map((c) => `${c} = VALUES(${c})`).join(', ');
      await conn.execute(
        `INSERT INTO est_fildeo (${cols.join(',')}) VALUES (${placeholders})
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

async function eliminar(juego_id, roster_id, posicion) {
  let sql = 'DELETE FROM est_fildeo WHERE juego_id = ? AND roster_id = ?';
  const vals = [juego_id, roster_id];
  if (posicion) { sql += ' AND posicion = ?'; vals.push(posicion); }
  await pool.execute(sql, vals);
}

module.exports = { POSICIONES, CAMPOS, obtenerPorJuego, guardar, eliminar };
