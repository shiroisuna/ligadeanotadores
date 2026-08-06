const pool = require('../config/db');

async function obtener(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT * FROM vw_tabla_posiciones
     WHERE temporada_categoria_id = ?
     ORDER BY grupo, jg DESC, jp ASC, carreras_anotadas DESC`,
    [temporada_categoria_id]
  );
  return rows;
}

module.exports = { obtener };
