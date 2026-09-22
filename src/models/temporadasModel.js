const pool = require('../config/db');

// ---- Temporadas ----

async function listar() {
  const [rows] = await pool.query('SELECT * FROM temporadas ORDER BY fecha_inicio DESC');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM temporadas WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombre, fecha_inicio, activa }) {
  const [res] = await pool.execute(
    'INSERT INTO temporadas (nombre, fecha_inicio, activa) VALUES (?, ?, ?)',
    [nombre, fecha_inicio || null, activa ? 1 : 0]
  );
  return obtenerPorId(res.insertId);
}

async function actualizar(id, { nombre, fecha_inicio, activa }) {
  await pool.execute(
    'UPDATE temporadas SET nombre=?, fecha_inicio=?, activa=? WHERE id=?',
    [nombre, fecha_inicio || null, activa ? 1 : 0, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM temporadas WHERE id = ?', [id]);
}

// ---- temporada_categoria ----
// Nombres exactos que temporadasService.js espera

async function listarCategoriasDeTemporada(temporada_id) {
  const [rows] = await pool.execute(
    `SELECT tc.id, tc.copa_nombre, tc.temporada_id, tc.categoria_id,
            c.nombre AS categoria_nombre, c.lleva_pitcheo, c.nivel_standings,
            c.num_innings, d.nombre AS disciplina
     FROM temporada_categoria tc
     JOIN categorias c ON c.id = tc.categoria_id
     JOIN disciplinas d ON d.id = c.disciplina_id
     WHERE tc.temporada_id = ?
     ORDER BY d.nombre, c.nombre`,
    [temporada_id]
  );
  return rows;
}

async function obtenerCruzePorId(id) {
  const [rows] = await pool.execute(
    `SELECT tc.*, c.nombre AS categoria_nombre, t.nombre AS temporada_nombre
     FROM temporada_categoria tc
     JOIN categorias c ON c.id = tc.categoria_id
     JOIN temporadas t ON t.id = tc.temporada_id
     WHERE tc.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function crearCruce({ temporada_id, categoria_id, copa_nombre }) {
  const [res] = await pool.execute(
    `INSERT INTO temporada_categoria (temporada_id, categoria_id, copa_nombre)
     VALUES (?, ?, ?)`,
    [temporada_id, categoria_id, copa_nombre || null]
  );
  return obtenerCruzePorId(res.insertId);
}

async function actualizarCruce(id, { copa_nombre }) {
  await pool.execute(
    'UPDATE temporada_categoria SET copa_nombre=? WHERE id=?',
    [copa_nombre || null, id]
  );
  return obtenerCruzePorId(id);
}

async function eliminarCruce(id) {
  await pool.execute('DELETE FROM temporada_categoria WHERE id=?', [id]);
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, eliminar,
  listarCategoriasDeTemporada, obtenerCruzePorId,
  crearCruce, actualizarCruce, eliminarCruce,
};
