const pool = require('../config/db');

async function listarPorRoster(roster_id) {
  const [rows] = await pool.execute(
    `SELECT cl.*, j.nombres, j.apellidos
     FROM control_lanzadores cl
     JOIN roster r ON r.id = cl.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE cl.roster_id = ?
     ORDER BY cl.fecha DESC`,
    [roster_id]
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM control_lanzadores WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ roster_id, fecha, innings_lanzados, condicion }) {
  const [result] = await pool.execute(
    `INSERT INTO control_lanzadores (roster_id, fecha, innings_lanzados, condicion)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE innings_lanzados = VALUES(innings_lanzados), condicion = VALUES(condicion)`,
    [roster_id, fecha, innings_lanzados, condicion]
  );
  // con ON DUPLICATE KEY UPDATE, insertId puede no venir si fue un update;
  // buscamos por roster_id+fecha para devolver el registro correcto en ambos casos.
  const [rows] = await pool.execute(
    'SELECT * FROM control_lanzadores WHERE roster_id = ? AND fecha = ?',
    [roster_id, fecha]
  );
  return rows[0] || null;
}

async function eliminar(id) {
  await pool.execute('DELETE FROM control_lanzadores WHERE id = ?', [id]);
}

// Suma de innings lanzados en los últimos N días — referencia para que el
// administrador decida el descanso (el reglamento exacto queda pendiente
// de confirmar).
async function resumenUltimosDias(roster_id, dias) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(innings_lanzados), 0) AS innings_acumulados, COUNT(*) AS apariciones
     FROM control_lanzadores
     WHERE roster_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [roster_id, dias]
  );
  return rows[0];
}

module.exports = { listarPorRoster, obtenerPorId, crear, eliminar, resumenUltimosDias };
