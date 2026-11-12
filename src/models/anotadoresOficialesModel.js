const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.execute(
    'SELECT * FROM anotadores_oficiales WHERE activo = 1 ORDER BY apellidos, nombres'
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM anotadores_oficiales WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombres, apellidos, cedula, telefono }) {
  const [result] = await pool.execute(
    'INSERT INTO anotadores_oficiales (nombres, apellidos, cedula, telefono) VALUES (?, ?, ?, ?)',
    [nombres, apellidos, cedula || null, telefono || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombres, apellidos, cedula, telefono }) {
  await pool.execute(
    'UPDATE anotadores_oficiales SET nombres=?, apellidos=?, cedula=?, telefono=? WHERE id=?',
    [nombres, apellidos, cedula || null, telefono || null, id]
  );
  return obtenerPorId(id);
}

// Baja lógica — así no se pierden los anotadores oficiales ya asociados a juegos pasados.
async function desactivar(id) {
  await pool.execute('UPDATE anotadores_oficiales SET activo = 0 WHERE id = ?', [id]);
}

// ── Relación con juegos ────────────────────────────────────────────────
async function listarPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT ja.id AS relacion_id, ja.rol, a.*
     FROM juego_anotadores_oficiales ja
     JOIN anotadores_oficiales a ON a.id = ja.anotador_id
     WHERE ja.juego_id = ?
     ORDER BY ja.id`,
    [juego_id]
  );
  return rows;
}

// Reemplaza por completo la lista de anotadores oficiales de un juego.
// anotadores = [{ anotador_id, rol }, ...]
async function guardarPorJuego(juego_id, anotadores) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM juego_anotadores_oficiales WHERE juego_id = ?', [juego_id]);
    for (const a of anotadores) {
      await conn.execute(
        'INSERT INTO juego_anotadores_oficiales (juego_id, anotador_id, rol) VALUES (?, ?, ?)',
        [juego_id, a.anotador_id, a.rol || null]
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
