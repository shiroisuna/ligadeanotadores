const pool = require('../config/db');

// Equipos de una fase. La eliminatoria usa los equipos inscritos y su grupo de siempre.
async function equiposDeFase(temporada_categoria_id, fase) {
  if (fase === 'eliminatoria') {
    const [rows] = await pool.execute(
      `SELECT ei.id AS equipo_inscrito_id, ei.id, e.nombre, e.logo_url, ei.grupo
       FROM equipos_inscritos ei JOIN equipos e ON e.id = ei.equipo_id
       WHERE ei.temporada_categoria_id = ?
       ORDER BY ei.grupo, e.nombre`,
      [temporada_categoria_id]
    );
    return rows;
  }
  const [rows] = await pool.execute(
    `SELECT fe.equipo_inscrito_id, fe.equipo_inscrito_id AS id, e.nombre, e.logo_url, fe.grupo
     FROM fase_equipos fe
     JOIN equipos_inscritos ei ON ei.id = fe.equipo_inscrito_id
     JOIN equipos e ON e.id = ei.equipo_id
     WHERE fe.temporada_categoria_id = ? AND fe.fase = ?
     ORDER BY fe.grupo, e.nombre`,
    [temporada_categoria_id, fase]
  );
  return rows;
}

// Fases que ya tienen equipos asignados (además de la eliminatoria, que siempre existe).
async function fasesConEquipos(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT fase, COUNT(*) AS equipos FROM fase_equipos
     WHERE temporada_categoria_id = ? GROUP BY fase`,
    [temporada_categoria_id]
  );
  return rows;
}

async function inscritosDeCategoria(temporada_categoria_id) {
  const [rows] = await pool.execute(
    'SELECT id FROM equipos_inscritos WHERE temporada_categoria_id = ?',
    [temporada_categoria_id]
  );
  return rows.map((r) => Number(r.id));
}

// Equipos con juegos registrados en la fase (no se pueden quitar de ella).
async function equiposConJuegosEnFase(temporada_categoria_id, fase) {
  const [rows] = await pool.execute(
    `SELECT equipo_local_id AS id FROM juegos WHERE temporada_categoria_id = ? AND fase = ?
     UNION
     SELECT equipo_visitante_id FROM juegos WHERE temporada_categoria_id = ? AND fase = ?`,
    [temporada_categoria_id, fase, temporada_categoria_id, fase]
  );
  return rows.map((r) => Number(r.id));
}

async function reemplazarEquipos(temporada_categoria_id, fase, equipos) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'DELETE FROM fase_equipos WHERE temporada_categoria_id = ? AND fase = ?',
      [temporada_categoria_id, fase]
    );
    for (const e of equipos) {
      await conn.execute(
        `INSERT INTO fase_equipos (temporada_categoria_id, fase, equipo_inscrito_id, grupo)
         VALUES (?, ?, ?, ?)`,
        [temporada_categoria_id, fase, e.equipo_inscrito_id, e.grupo || null]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function equipoEnFase(temporada_categoria_id, fase, equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM fase_equipos
     WHERE temporada_categoria_id = ? AND fase = ? AND equipo_inscrito_id = ? LIMIT 1`,
    [temporada_categoria_id, fase, equipo_inscrito_id]
  );
  return rows.length > 0;
}

module.exports = {
  equiposDeFase, fasesConEquipos, inscritosDeCategoria,
  equiposConJuegosEnFase, reemplazarEquipos, equipoEnFase,
};
