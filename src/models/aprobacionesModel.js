const pool = require('../config/db');

// ── Pendientes de aprobación ──────────────────────────────────────────

async function contarPendientes() {
  const [[juegos]] = await pool.execute(
    `SELECT COUNT(*) AS n FROM juegos
     WHERE estado != 'programado' AND resultado_aprobado = 0`
  );
  const [[bateo]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM est_bateo WHERE aprobado = 0'
  );
  const [[pitcheo]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM est_pitcheo WHERE aprobado = 0'
  );
  const [[fildeo]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM est_fildeo WHERE aprobado = 0'
  );
  const [[boxBateo]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM bateo_juego WHERE aprobado = 0'
  );
  const [[boxPitcheo]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM pitcheo_juego WHERE aprobado = 0'
  );
  const total = juegos.n + bateo.n + pitcheo.n + fildeo.n + boxBateo.n + boxPitcheo.n;
  return { total, juegos: juegos.n, estadisticas: bateo.n + pitcheo.n + fildeo.n, boxscore: boxBateo.n + boxPitcheo.n };
}

async function listarJuegosPendientes() {
  const [rows] = await pool.execute(
    `SELECT j.id, j.fecha, j.hora, j.estado,
            j.carreras_local, j.carreras_visitante,
            el.nombre AS equipo_local, ev.nombre AS equipo_visitante,
            u.email AS cargado_por,
            tc.id AS temporada_categoria_id,
            c.nombre AS categoria, t.nombre AS temporada
     FROM juegos j
     JOIN equipos_inscritos eil ON eil.id = j.equipo_local_id
     JOIN equipos el ON el.id = eil.equipo_id
     JOIN equipos_inscritos eiv ON eiv.id = j.equipo_visitante_id
     JOIN equipos ev ON ev.id = eiv.equipo_id
     JOIN temporada_categoria tc ON tc.id = j.temporada_categoria_id
     JOIN categorias c ON c.id = tc.categoria_id
     JOIN temporadas t ON t.id = tc.temporada_id
     LEFT JOIN usuarios u ON u.id = j.cargado_por_id
     WHERE j.estado != 'programado' AND j.resultado_aprobado = 0
     ORDER BY j.fecha DESC`
  );
  return rows;
}

async function listarEstadisticasPendientes() {
  const [bateo] = await pool.execute(
    `SELECT 'bateo' AS tipo, eb.juego_id, eb.roster_id,
            j.nombres, j.apellidos, eq.nombre AS equipo,
            COUNT(*) AS registros
     FROM est_bateo eb
     JOIN roster r ON r.id = eb.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE eb.aprobado = 0
     GROUP BY eb.juego_id`
  );
  const [pitcheo] = await pool.execute(
    `SELECT 'pitcheo' AS tipo, ep.juego_id, ep.roster_id,
            j.nombres, j.apellidos, eq.nombre AS equipo,
            COUNT(*) AS registros
     FROM est_pitcheo ep
     JOIN roster r ON r.id = ep.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE ep.aprobado = 0
     GROUP BY ep.juego_id`
  );
  const [fildeo] = await pool.execute(
    `SELECT 'fildeo' AS tipo, ef.juego_id, ef.roster_id,
            j.nombres, j.apellidos, eq.nombre AS equipo,
            COUNT(*) AS registros
     FROM est_fildeo ef
     JOIN roster r ON r.id = ef.roster_id
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE ef.aprobado = 0
     GROUP BY ef.juego_id`
  );
  return [...bateo, ...pitcheo, ...fildeo];
}

// ── Aprobar / rechazar ────────────────────────────────────────────────

async function aprobarJuego(juego_id) {
  await pool.execute(
    'UPDATE juegos SET resultado_aprobado = 1 WHERE id = ?', [juego_id]
  );
}

async function rechazarJuego(juego_id) {
  // Revierte el resultado — vuelve a programado
  await pool.execute(
    `UPDATE juegos SET estado = 'programado', resultado_aprobado = 0,
     carreras_local = NULL, carreras_visitante = NULL,
     hits_local = NULL, hits_visitante = NULL,
     errores_local = NULL, errores_visitante = NULL
     WHERE id = ?`, [juego_id]
  );
}

async function aprobarEstadisticasJuego(juego_id) {
  await pool.execute('UPDATE est_bateo   SET aprobado = 1 WHERE juego_id = ?', [juego_id]);
  await pool.execute('UPDATE est_pitcheo SET aprobado = 1 WHERE juego_id = ?', [juego_id]);
  await pool.execute('UPDATE est_fildeo  SET aprobado = 1 WHERE juego_id = ?', [juego_id]);
  await pool.execute('UPDATE bateo_juego    SET aprobado = 1 WHERE juego_id = ?', [juego_id]);
  await pool.execute('UPDATE pitcheo_juego  SET aprobado = 1 WHERE juego_id = ?', [juego_id]);
}

async function rechazarEstadisticasJuego(juego_id) {
  await pool.execute('DELETE FROM est_bateo   WHERE juego_id = ? AND aprobado = 0', [juego_id]);
  await pool.execute('DELETE FROM est_pitcheo WHERE juego_id = ? AND aprobado = 0', [juego_id]);
  await pool.execute('DELETE FROM est_fildeo  WHERE juego_id = ? AND aprobado = 0', [juego_id]);
  await pool.execute('DELETE FROM bateo_juego    WHERE juego_id = ? AND aprobado = 0', [juego_id]);
  await pool.execute('DELETE FROM pitcheo_juego  WHERE juego_id = ? AND aprobado = 0', [juego_id]);
}

// Aprobar todo de un juego de una vez
async function aprobarTodo(juego_id) {
  await aprobarJuego(juego_id);
  await aprobarEstadisticasJuego(juego_id);
}

module.exports = {
  contarPendientes,
  listarJuegosPendientes, listarEstadisticasPendientes,
  aprobarJuego, rechazarJuego,
  aprobarEstadisticasJuego, rechazarEstadisticasJuego,
  aprobarTodo,
};
