const pool = require('../config/db');

// Orden de la tabla de posiciones, por grupo:
//   1) juegos ganados (más primero) y juegos perdidos (menos primero)
//   2) si hay empate -> balance de calidad (BCE), mayor primero
//   3) si persiste el empate -> carreras anotadas, mayor primero
// Los equipos sin BCE (sin innings cargados aún) quedan de últimos dentro del empate.
async function obtener(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT * FROM vw_tabla_posiciones
     WHERE temporada_categoria_id = ?
     ORDER BY grupo, jg DESC, jp ASC,
              (bce IS NULL) ASC, bce DESC,
              carreras_anotadas DESC`,
    [temporada_categoria_id]
  );
  return rows;
}

module.exports = { obtener };