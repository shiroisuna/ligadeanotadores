const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.execute(
    'SELECT * FROM arbitros WHERE activo = 1 ORDER BY apellidos, nombres'
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM arbitros WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombres, apellidos, cedula, telefono }) {
  const [result] = await pool.execute(
    'INSERT INTO arbitros (nombres, apellidos, cedula, telefono) VALUES (?, ?, ?, ?)',
    [nombres, apellidos, cedula || null, telefono || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombres, apellidos, cedula, telefono }) {
  await pool.execute(
    'UPDATE arbitros SET nombres=?, apellidos=?, cedula=?, telefono=? WHERE id=?',
    [nombres, apellidos, cedula || null, telefono || null, id]
  );
  return obtenerPorId(id);
}

// Baja lógica — así no se pierden los árbitros ya asociados a juegos pasados.
async function desactivar(id) {
  await pool.execute('UPDATE arbitros SET activo = 0 WHERE id = ?', [id]);
}

// ── Relación con juegos ────────────────────────────────────────────────
async function listarPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT ja.id AS relacion_id, ja.rol, a.*
     FROM juego_arbitros ja
     JOIN arbitros a ON a.id = ja.arbitro_id
     WHERE ja.juego_id = ?
     ORDER BY ja.id`,
    [juego_id]
  );
  return rows;
}

// Reemplaza por completo la lista de árbitros de un juego.
// arbitros = [{ arbitro_id, rol }, ...]
async function guardarPorJuego(juego_id, arbitros) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM juego_arbitros WHERE juego_id = ?', [juego_id]);
    for (const a of arbitros) {
      await conn.execute(
        'INSERT INTO juego_arbitros (juego_id, arbitro_id, rol) VALUES (?, ?, ?)',
        [juego_id, a.arbitro_id, a.rol || null]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return listarPorJuego(juego_id);
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, desactivar,
  listarPorJuego, guardarPorJuego,
};