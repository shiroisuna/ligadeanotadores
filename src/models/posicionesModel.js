const pool = require('../config/db');

// Orden BASE (Béisbol Mayor): juegos ganados, perdidos, balance de calidad, carreras anotadas.
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

// Disciplina de la categoría (para saber si es Béisbol Menor, Softbol o Béisbol Mayor)
async function disciplinaDeCategoria(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT d.nombre AS disciplina
     FROM temporada_categoria tc
     JOIN categorias c ON c.id = tc.categoria_id
     JOIN disciplinas d ON d.id = c.disciplina_id
     WHERE tc.id = ?`,
    [temporada_categoria_id]
  );
  return rows[0] ? rows[0].disciplina : '';
}

// Juegos con resultado aprobado de la categoría (para el desempate por confrontación directa)
async function juegosAprobados(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT equipo_local_id, equipo_visitante_id, carreras_local, carreras_visitante,
            estado, equipo_ganador_id
     FROM juegos
     WHERE temporada_categoria_id = ? AND resultado_aprobado = 1
       AND estado IN ('jugado','ganado_forfeit','ganado_mesa','ganado_retiro')`,
    [temporada_categoria_id]
  );
  return rows;
}

module.exports = { obtener, disciplinaDeCategoria, juegosAprobados };