const pool = require('../config/db');

// ---- jugadores (catálogo general de personas) ----

async function listar() {
  // Sin email/telefono aquí a propósito: este listado alimenta selects
  // públicos (catálogo para inscribir jugadores, etc.) — el contacto solo
  // sale por rutas protegidas (ver obtenerPerfilContactoPorRoster).
  // foto_url sí se incluye: no es un dato de contacto sensible.
  const [rows] = await pool.query(
    'SELECT id, nombres, apellidos, fecha_nacimiento, foto_url FROM jugadores ORDER BY apellidos, nombres'
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute(
    'SELECT id, nombres, apellidos, fecha_nacimiento, email, telefono, foto_url FROM jugadores WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function crear({ nombres, apellidos, fecha_nacimiento, email, telefono, foto_url }) {
  const [result] = await pool.execute(
    'INSERT INTO jugadores (nombres, apellidos, fecha_nacimiento, email, telefono, foto_url) VALUES (?, ?, ?, ?, ?, ?)',
    [nombres, apellidos, fecha_nacimiento || null, email || null, telefono || null, foto_url || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombres, apellidos, fecha_nacimiento, email, telefono, foto_url }) {
  await pool.execute(
    'UPDATE jugadores SET nombres = ?, apellidos = ?, fecha_nacimiento = ?, email = ?, telefono = ?, foto_url = ? WHERE id = ?',
    [nombres, apellidos, fecha_nacimiento || null, email || null, telefono || null, foto_url || null, id]
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

// Todos los roster (equipo+temporada+categoría) en los que ha estado un
// jugador — usado para que el propio jugador vea "sus tarjetas".
async function listarRosterPorJugador(jugador_id) {
  const [rows] = await pool.execute(
    `SELECT r.id AS roster_id, r.numero_camiseta, r.posicion_principal,
            eq.nombre AS equipo, eq.logo_url, c.nombre AS categoria_nombre,
            t.nombre AS temporada_nombre, t.activa AS temporada_activa,
            tc.id AS temporada_categoria_id
     FROM roster r
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     JOIN temporada_categoria tc ON tc.id = ei.temporada_categoria_id
     JOIN categorias c ON c.id = tc.categoria_id
     JOIN temporadas t ON t.id = tc.temporada_id
     WHERE r.jugador_id = ?
     ORDER BY t.activa DESC, t.fecha_inicio DESC`,
    [jugador_id]
  );
  return rows;
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, eliminar,
  listarRosterPorEquipo, obtenerRosterPorId, agregarARoster, actualizarRoster, eliminarDeRoster,
  listarRosterPorJugador,
};

// Perfil con datos de contacto (email/teléfono/fecha de nacimiento) para
// un roster específico. Nunca se expone en un endpoint público — solo a
// través de /jugadores/perfil/:roster_id, protegido por requireAuth y
// verificado en el service (admin, o el propio jugador dueño del roster).
async function obtenerPerfilContactoPorRoster(roster_id) {
  const [rows] = await pool.execute(
    `SELECT r.id AS roster_id, r.jugador_id, r.numero_camiseta, r.posicion_principal,
            j.nombres, j.apellidos, j.fecha_nacimiento, j.email, j.telefono,
            eq.nombre AS equipo
     FROM roster r
     JOIN jugadores j ON j.id = r.jugador_id
     JOIN equipos_inscritos ei ON ei.id = r.equipo_inscrito_id
     JOIN equipos eq ON eq.id = ei.equipo_id
     WHERE r.id = ?`,
    [roster_id]
  );
  return rows[0] || null;
}
module.exports.obtenerPerfilContactoPorRoster = obtenerPerfilContactoPorRoster;
