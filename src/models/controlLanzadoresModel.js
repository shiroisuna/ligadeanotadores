const pool = require('../config/db');

async function listarPorTemporada(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT cl.*, j.nombres, j.apellidos,
            ei.id AS equipo_inscrito_id, eq.nombre AS equipo,
            tc.id AS temporada_categoria_id, tc.temporada_id,
            DATEDIFF(CURDATE(), cl.fecha) AS dias_desde_juego,
            (
              SELECT r.dias_descanso FROM control_lanzadores_reglas r
              WHERE (r.categoria_id IS NULL OR r.categoria_id = tc.categoria_id)
                AND cl.envios BETWEEN r.envios_min AND r.envios_max
              ORDER BY r.categoria_id DESC LIMIT 1
            ) AS dias_descanso_requeridos,
            CASE WHEN DATEDIFF(CURDATE(), cl.fecha) >= COALESCE((
              SELECT r.dias_descanso FROM control_lanzadores_reglas r
              WHERE (r.categoria_id IS NULL OR r.categoria_id = tc.categoria_id)
                AND cl.envios BETWEEN r.envios_min AND r.envios_max
              ORDER BY r.categoria_id DESC LIMIT 1
            ), 0) THEN 1 ELSE 0 END AS puede_lanzar_hoy
     FROM (
       SELECT cl2.* FROM control_lanzadores cl2
       JOIN (
         SELECT roster_id, MAX(fecha) AS max_fecha
         FROM control_lanzadores GROUP BY roster_id
       ) ult ON ult.roster_id = cl2.roster_id AND ult.max_fecha = cl2.fecha
     ) cl
     JOIN roster r             ON r.id  = cl.roster_id
     JOIN jugadores j          ON j.id  = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq           ON eq.id = ei.equipo_id
     JOIN temporada_categoria tc ON tc.id = ei.temporada_categoria_id
     WHERE tc.id = ?
     ORDER BY puede_lanzar_hoy ASC, dias_desde_juego ASC`,
    [temporada_categoria_id]
  );
  return rows;
}

async function registrar({ roster_id, juego_id, fecha, hora, envios, innings_lanzados, condicion }) {
  await pool.execute(
    `INSERT INTO control_lanzadores
       (roster_id, juego_id, fecha, hora, envios, innings_lanzados, condicion)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       juego_id = VALUES(juego_id),
       hora = VALUES(hora),
       envios = VALUES(envios),
       innings_lanzados = VALUES(innings_lanzados),
       condicion = VALUES(condicion)`,
    [roster_id, juego_id || null, fecha, hora || null, envios || 0, innings_lanzados || 0, condicion || null]
  );
  // Devolver el registro recién guardado
  const [rows] = await pool.execute(
    'SELECT * FROM control_lanzadores WHERE roster_id = ? AND fecha = ? ORDER BY id DESC LIMIT 1',
    [roster_id, fecha]
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
     SET envios_min=?, envios_max=?, dias_descanso=?, descripcion=? WHERE id=?`,
    [envios_min, envios_max, dias_descanso, descripcion || null, id]
  );
  const [rows] = await pool.execute(
    'SELECT * FROM control_lanzadores_reglas WHERE id=?', [id]
  );
  return rows[0];
}


async function obtenerPorId(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM control_lanzadores WHERE id = ?', [id]
  );
  return rows[0] || null;
}

module.exports = {
  listarPorTemporada, registrar, eliminar, listarReglas, actualizarRegla, obtenerPorId
};
