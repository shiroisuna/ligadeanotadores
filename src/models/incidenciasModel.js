const pool = require('../config/db');

const TIPOS = ['sancion', 'novedad', 'protesta', 'otro'];

async function listarPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT i.*, j.nombres, j.apellidos, eq.nombre AS equipo
     FROM incidencias i
     LEFT JOIN roster r ON r.id = i.roster_id
     LEFT JOIN jugadores j ON j.id = r.jugador_id
     LEFT JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     LEFT JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE i.juego_id = ?
     ORDER BY i.creado_en DESC`,
    [juego_id]
  );
  return rows;
}

// Todas las incidencias de una categoría dentro de un rango de fechas
// (usado para el reporte público por periodo).
async function listarPorRangoFecha(temporada_categoria_id, fecha_inicio, fecha_fin) {
  const [rows] = await pool.execute(
    `SELECT i.*, j.fecha AS fecha_juego,
            elq.nombre AS equipo_local, evq.nombre AS equipo_visitante,
            jr.nombres, jr.apellidos, eq.nombre AS equipo
     FROM incidencias i
     JOIN juegos j ON j.id = i.juego_id
     JOIN equipos_inscritos el ON el.id = j.equipo_local_id
     JOIN equipos elq ON elq.id = el.equipo_id
     JOIN equipos_inscritos ev ON ev.id = j.equipo_visitante_id
     JOIN equipos evq ON evq.id = ev.equipo_id
     LEFT JOIN roster r ON r.id = i.roster_id
     LEFT JOIN jugadores jr ON jr.id = r.jugador_id
     LEFT JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     LEFT JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE j.temporada_categoria_id = ? AND j.fecha BETWEEN ? AND ?
     ORDER BY j.fecha, j.id`,
    [temporada_categoria_id, fecha_inicio, fecha_fin]
  );
  return rows;
}

async function crear({ juego_id, roster_id, tipo, descripcion }) {
  const [result] = await pool.execute(
    `INSERT INTO incidencias (juego_id, roster_id, tipo, descripcion)
     VALUES (?, ?, ?, ?)`,
    [juego_id, roster_id || null, tipo, descripcion]
  );
  const [rows] = await pool.execute('SELECT * FROM incidencias WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function eliminar(id) {
  await pool.execute('DELETE FROM incidencias WHERE id = ?', [id]);
}

module.exports = { TIPOS, listarPorJuego, listarPorRangoFecha, crear, eliminar };