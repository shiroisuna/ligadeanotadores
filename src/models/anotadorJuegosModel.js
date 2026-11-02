const pool = require('../config/db');

async function listarPorJuego(juego_id) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.email FROM anotador_juegos aj
     JOIN usuarios u ON u.id = aj.usuario_id
     WHERE aj.juego_id = ? ORDER BY u.email`, [juego_id]);
  return rows;
}

async function reemplazarPorJuego(juego_id, usuario_ids) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM anotador_juegos WHERE juego_id = ?', [juego_id]);
    for (const uid of usuario_ids) {
      await conn.execute('INSERT INTO anotador_juegos (usuario_id, juego_id) VALUES (?, ?)', [uid, juego_id]);
    }
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}

async function juegosDeUsuario(usuario_id) {
  const [rows] = await pool.execute('SELECT juego_id FROM anotador_juegos WHERE usuario_id = ?', [usuario_id]);
  return rows.map((r) => r.juego_id);
}

async function tienePermiso(usuario_id, juego_id) {
  const [rows] = await pool.execute(
    'SELECT 1 FROM anotador_juegos WHERE usuario_id = ? AND juego_id = ? LIMIT 1', [usuario_id, juego_id]);
  return rows.length > 0;
}

async function usuariosAnotadoresActivos() {
  const [rows] = await pool.execute(
    "SELECT id, email FROM usuarios WHERE rol = 'anotador' AND activo = 1 ORDER BY email");
  return rows;
}

module.exports = { listarPorJuego, reemplazarPorJuego, juegosDeUsuario, tienePermiso, usuariosAnotadoresActivos };
