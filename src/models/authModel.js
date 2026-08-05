const pool = require('../config/db');

async function buscarPorEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
    [email]
  );
  return rows[0] || null;
}

module.exports = { buscarPorEmail };
