const pool = require('../config/db');

// ---- jugadores (catálogo general de personas) ----

async function listar() {
  const [rows] = await pool.query('SELECT * FROM jugadores ORDER BY apellidos, nombres');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM jugadores WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crear({ nombres, apellidos, fecha_nacimiento }) {
  const [result] = await pool.execute(
    'INSERT INTO jugadores (nombres, apellidos, fecha_nacimiento) VALUES (?, ?, ?)',
    [nombres, apellidos, fecha_nacimiento || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombres, apellidos, fecha_nacimiento }) {
  await pool.execute(
    'UPDATE jugadores SET nombres = ?, apellidos = ?, fecha_nacimiento = ? WHERE id = ?',
    [nombres, apellidos, fecha_nacimiento || null, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM jugadores WHERE id = ?', [id]);
}

// ---- roster (jugador dentro de un equipo_inscrito, con número y posición) ----

async function listarRosterPorEquipo(equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.numero_camiseta, r.posicion_principal, r.activo,
            j.id AS jugador_id, j.nombres, j.apellidos
     FROM roster r
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE r.equipo_inscrito_id = ?
     ORDER BY r.numero_camiseta`,
    [equipo_inscrito_id]
  );
  return rows;
}

async function obtenerRosterPorId(id) {
  const [rows] = await pool.execute(
    `SELECT r.*, j.nombres, j.apellidos
     FROM roster r
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function agregarARoster({ jugador_id, equipo_inscrito_id, numero_camiseta, posicion_principal }) {
  const [result] = await pool.execute(
    `INSERT INTO roster (jugador_id, equipo_inscrito_id, numero_camiseta, posicion_principal)
     VALUES (?, ?, ?, ?)`,
    [jugador_id, equipo_inscrito_id, numero_camiseta || null, posicion_principal || null]
  );
  return obtenerRosterPorId(result.insertId);
}

async function actualizarRoster(id, { numero_camiseta, posicion_principal, activo }) {
  await pool.execute(
    'UPDATE roster SET numero_camiseta = ?, posicion_principal = ?, activo = ? WHERE id = ?',
    [numero_camiseta || null, posicion_principal || null, activo === undefined ? true : !!activo, id]
  );
  return obtenerRosterPorId(id);
}

async function eliminarDeRoster(id) {
  await pool.execute('DELETE FROM roster WHERE id = ?', [id]);
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, eliminar,
  listarRosterPorEquipo, obtenerRosterPorId, agregarARoster, actualizarRoster, eliminarDeRoster,
};
