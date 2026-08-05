const pool = require('../config/db');

// ---- temporadas ----

async function listar() {
  const [rows] = await pool.query('SELECT * FROM temporadas ORDER BY fecha_inicio DESC');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM temporadas WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombre, fecha_inicio, fecha_fin, activa }) {
  const [result] = await pool.execute(
    'INSERT INTO temporadas (nombre, fecha_inicio, fecha_fin, activa) VALUES (?, ?, ?, ?)',
    [nombre, fecha_inicio || null, fecha_fin || null, activa === undefined ? true : !!activa]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombre, fecha_inicio, fecha_fin, activa }) {
  await pool.execute(
    'UPDATE temporadas SET nombre = ?, fecha_inicio = ?, fecha_fin = ?, activa = ? WHERE id = ?',
    [nombre, fecha_inicio || null, fecha_fin || null, !!activa, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM temporadas WHERE id = ?', [id]);
}

// ---- temporada_categoria (cruce: qué categorías corren en qué temporada, y su copa) ----

async function listarCategoriasDeTemporada(temporada_id) {
  const [rows] = await pool.execute(
    `SELECT tc.id, tc.copa_nombre, tc.posiciones_al_fecha, tc.recopilador,
            c.id AS categoria_id, c.nombre AS categoria_nombre, c.lleva_pitcheo, c.nivel_standings,
            d.nombre AS disciplina
     FROM temporada_categoria tc
     JOIN categorias c ON c.id = tc.categoria_id
     JOIN disciplinas d ON d.id = c.disciplina_id
     WHERE tc.temporada_id = ?
     ORDER BY c.orden_visual, c.nombre`,
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

async function crearCruce({ temporada_id, categoria_id, copa_nombre, posiciones_al_fecha, recopilador }) {
  const [result] = await pool.execute(
    `INSERT INTO temporada_categoria (temporada_id, categoria_id, copa_nombre, posiciones_al_fecha, recopilador)
     VALUES (?, ?, ?, ?, ?)`,
    [temporada_id, categoria_id, copa_nombre || null, posiciones_al_fecha || null, recopilador || null]
  );
  return obtenerCruzePorId(result.insertId);
}

async function actualizarCruce(id, { copa_nombre, posiciones_al_fecha, recopilador }) {
  await pool.execute(
    `UPDATE temporada_categoria
     SET copa_nombre = ?, posiciones_al_fecha = ?, recopilador = ?
     WHERE id = ?`,
    [copa_nombre || null, posiciones_al_fecha || null, recopilador || null, id]
  );
  return obtenerCruzePorId(id);
}

async function eliminarCruce(id) {
  await pool.execute('DELETE FROM temporada_categoria WHERE id = ?', [id]);
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, eliminar,
  listarCategoriasDeTemporada, obtenerCruzePorId, crearCruce, actualizarCruce, eliminarCruce,
};
