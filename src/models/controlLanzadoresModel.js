const pool = require('../config/db');

async function listarPorTemporada(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT * FROM vw_control_lanzadores
     WHERE temporada_categoria_id = ?
     ORDER BY puede_lanzar_hoy ASC, dias_desde_juego ASC`,
    [temporada_categoria_id]
  );
  return rows;
}

async function registrar({ roster_id, juego_id, fecha, envios, innings_l, observacion }) {
  const [res] = await pool.execute(
    `INSERT INTO control_lanzadores (roster_id, juego_id, fecha, envios, innings_l, observacion)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       fecha = VALUES(fecha), envios = VALUES(envios),
       innings_l = VALUES(innings_l), observacion = VALUES(observacion)`,
    [roster_id, juego_id, fecha, envios, innings_l || 0, observacion || null]
  );
  return obtenerPorId(res.insertId || roster_id);
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM control_lanzadores WHERE id = ?', [id]
  );
  return rows[0] || null;
}

async function obtenerPorRosterJuego(roster_id, juego_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM control_lanzadores WHERE roster_id = ? AND juego_id = ?',
    [roster_id, juego_id]
  );
  return rows[0] || null;
}

async function eliminar(id) {
  await pool.execute('DELETE FROM control_lanzadores WHERE id = ?', [id]);
}

async function listarReglas() {
  const [rows] = await pool.execute(
    'SELECT * FROM control_lanzadores_reglas ORDER BY envios_min'
  );
  return rows;
}

async function actualizarRegla(id, { envios_min, envios_max, dias_descanso, descripcion }) {
  await pool.execute(
    `UPDATE control_lanzadores_reglas
     SET envios_min = ?, envios_max = ?, dias_descanso = ?, descripcion = ?
     WHERE id = ?`,
    [envios_min, envios_max, dias_descanso, descripcion || null, id]
  );
  const [rows] = await pool.execute('SELECT * FROM control_lanzadores_reglas WHERE id = ?', [id]);
  return rows[0];
}

module.exports = {
  listarPorTemporada, registrar, obtenerPorId,
  obtenerPorRosterJuego, eliminar, listarReglas, actualizarRegla,
};
