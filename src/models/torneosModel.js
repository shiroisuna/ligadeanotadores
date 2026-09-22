const pool = require('../config/db');

// ── Torneos ──────────────────────────────────────────────────────────

async function listarPorTemporadaCategoria(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT t.*, COUNT(tf.id) AS num_fases
     FROM torneos t
     LEFT JOIN torneo_fases tf ON tf.torneo_id = t.id
     WHERE t.temporada_categoria_id = ?
     GROUP BY t.id
     ORDER BY t.creado_en DESC`,
    [temporada_categoria_id]
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM torneos WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ temporada_categoria_id, nombre, descripcion }) {
  const [res] = await pool.execute(
    'INSERT INTO torneos (temporada_categoria_id, nombre, descripcion) VALUES (?, ?, ?)',
    [temporada_categoria_id, nombre, descripcion || null]
  );
  return obtenerPorId(res.insertId);
}

async function actualizar(id, { nombre, descripcion, activo }) {
  await pool.execute(
    'UPDATE torneos SET nombre=?, descripcion=?, activo=? WHERE id=?',
    [nombre, descripcion || null, activo ? 1 : 0, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM torneos WHERE id = ?', [id]);
}

// ── Fases ─────────────────────────────────────────────────────────────

async function listarFases(torneo_id) {
  const [rows] = await pool.execute(
    `SELECT tf.*, COUNT(tc.id) AS num_cruces
     FROM torneo_fases tf
     LEFT JOIN torneo_cruces tc ON tc.fase_id = tf.id
     WHERE tf.torneo_id = ?
     GROUP BY tf.id
     ORDER BY tf.orden`,
    [torneo_id]
  );
  return rows;
}

async function obtenerFasePorId(id) {
  const [rows] = await pool.execute('SELECT * FROM torneo_fases WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crearFase({ torneo_id, nombre, orden, num_equipos }) {
  const [res] = await pool.execute(
    'INSERT INTO torneo_fases (torneo_id, nombre, orden, num_equipos) VALUES (?, ?, ?, ?)',
    [torneo_id, nombre, orden, num_equipos || 2]
  );
  return obtenerFasePorId(res.insertId);
}

async function eliminarFase(id) {
  await pool.execute('DELETE FROM torneo_fases WHERE id = ?', [id]);
}

// ── Cruces ────────────────────────────────────────────────────────────

async function listarCrucesPorFase(fase_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM vw_torneo_cruces WHERE fase_id = ?',
    [fase_id]
  );
  return rows;
}

async function listarCrucesPorTorneo(torneo_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM vw_torneo_cruces WHERE torneo_id = ?',
    [torneo_id]
  );
  return rows;
}

async function obtenerCrucePorId(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM vw_torneo_cruces WHERE cruce_id = ?',
    [id]
  );
  return rows[0] || null;
}

async function crearCruce({ fase_id, equipo_local_id, equipo_visitante_id, juego_id, orden }) {
  const [res] = await pool.execute(
    `INSERT INTO torneo_cruces (fase_id, equipo_local_id, equipo_visitante_id, juego_id, orden)
     VALUES (?, ?, ?, ?, ?)`,
    [fase_id, equipo_local_id, equipo_visitante_id, juego_id || null, orden || 1]
  );
  return obtenerCrucePorId(res.insertId);
}

async function actualizarCruce(id, { juego_id, equipo_ganador_id }) {
  await pool.execute(
    'UPDATE torneo_cruces SET juego_id=?, equipo_ganador_id=? WHERE id=?',
    [juego_id || null, equipo_ganador_id || null, id]
  );
  return obtenerCrucePorId(id);
}

async function eliminarCruce(id) {
  await pool.execute('DELETE FROM torneo_cruces WHERE id = ?', [id]);
}

// Sincroniza el ganador del cruce con el resultado del juego vinculado
async function sincronizarGanador(cruce_id) {
  const [rows] = await pool.execute(
    `SELECT tc.id, tc.juego_id, tc.equipo_local_id, tc.equipo_visitante_id,
            j.estado, j.carreras_local, j.carreras_visitante, j.equipo_ganador_id
     FROM torneo_cruces tc
     LEFT JOIN juegos j ON j.id = tc.juego_id
     WHERE tc.id = ?`,
    [cruce_id]
  );
  const cruce = rows[0];
  if (!cruce || !cruce.juego_id) return;

  let ganador_id = null;
  if (cruce.estado === 'jugado') {
    ganador_id = cruce.carreras_local > cruce.carreras_visitante
      ? cruce.equipo_local_id
      : cruce.equipo_visitante_id;
  } else if (['ganado_forfeit', 'ganado_mesa', 'ganado_retiro'].includes(cruce.estado)) {
    ganador_id = cruce.equipo_ganador_id;
  }

  if (ganador_id) {
    await pool.execute(
      'UPDATE torneo_cruces SET equipo_ganador_id=? WHERE id=?',
      [ganador_id, cruce_id]
    );
  }
}

module.exports = {
  listarPorTemporadaCategoria, obtenerPorId, crear, actualizar, eliminar,
  listarFases, obtenerFasePorId, crearFase, eliminarFase,
  listarCrucesPorFase, listarCrucesPorTorneo, obtenerCrucePorId,
  crearCruce, actualizarCruce, eliminarCruce, sincronizarGanador,
};
