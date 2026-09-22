const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.query(
    'SELECT id, nombres, apellidos, fecha_nacimiento, foto_url, lado FROM jugadores ORDER BY apellidos, nombres'
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute(
    'SELECT id, nombres, apellidos, fecha_nacimiento, email, telefono, foto_url, lado FROM jugadores WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function crear({ nombres, apellidos, fecha_nacimiento, email, telefono, foto_url, lado }) {
  const [result] = await pool.execute(
    'INSERT INTO jugadores (nombres, apellidos, fecha_nacimiento, email, telefono, foto_url, lado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombres, apellidos, fecha_nacimiento || null, email || null, telefono || null, foto_url || null, lado || null]
  );
  return obtenerPorId(result.insertId);
}

async function actualizar(id, { nombres, apellidos, fecha_nacimiento, email, telefono, foto_url, lado }) {
  await pool.execute(
    'UPDATE jugadores SET nombres=?, apellidos=?, fecha_nacimiento=?, email=?, telefono=?, foto_url=?, lado=? WHERE id=?',
    [nombres, apellidos, fecha_nacimiento || null, email || null, telefono || null, foto_url || null, lado || null, id]
  );
  return obtenerPorId(id);
}

async function eliminar(id) {
  await pool.execute('DELETE FROM jugadores WHERE id = ?', [id]);
}

async function listarRosterPorEquipo(equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.numero_camiseta, r.posicion_principal,
            j.nombres, j.apellidos, j.foto_url, j.lado
     FROM roster r
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE r.equipo_inscrito_id = ?
     ORDER BY r.numero_camiseta`,
    [equipo_inscrito_id]
  );
  return rows;
}

async function listarPosicionesRoster(roster_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM roster_posiciones WHERE roster_id = ? ORDER BY orden',
    [roster_id]
  );
  return rows;
}

async function agregarARoster({ jugador_id, equipo_inscrito_id, numero_camiseta, posicion_principal }) {
  const [result] = await pool.execute(
    `INSERT INTO roster (jugador_id, equipo_inscrito_id, numero_camiseta, posicion_principal)
     VALUES (?, ?, ?, ?)`,
    [jugador_id, equipo_inscrito_id, numero_camiseta || null, posicion_principal || null]
  );
  return obtenerRosterPorId(result.insertId);
}

async function obtenerRosterPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM roster WHERE id = ?', [id]);
  return rows[0] || null;
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

async function guardarPosicionesRoster(roster_id, posiciones) {
  await pool.execute('DELETE FROM roster_posiciones WHERE roster_id = ?', [roster_id]);
  for (let i = 0; i < posiciones.length; i++) {
    await pool.execute(
      'INSERT INTO roster_posiciones (roster_id, posicion, orden) VALUES (?, ?, ?)',
      [roster_id, posiciones[i], i + 1]
    );
  }
  return listarPosicionesRoster(roster_id);
}

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

async function obtenerPerfilContactoPorRoster(roster_id) {
  const [rows] = await pool.execute(
    `SELECT j.id, j.nombres, j.apellidos, j.fecha_nacimiento,
            j.email, j.telefono, j.foto_url, j.lado,
            r.numero_camiseta, r.posicion_principal
     FROM roster r
     JOIN jugadores j ON j.id = r.jugador_id
     WHERE r.id = ?`,
    [roster_id]
  );
  return rows[0] || null;
}

// ── Helper para validar permisos de anotador ─────────────────────────
// Dado un arreglo de roster_id, devuelve un mapa { roster_id: equipo_inscrito_id }.
// Se usa para verificar que un anotador solo cargue estadísticas de
// jugadores de su propio equipo.
async function obtenerEquiposDeRoster(roster_ids) {
  if (!roster_ids || roster_ids.length === 0) return {};
  const placeholders = roster_ids.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT id, equipo_inscrito_id FROM roster WHERE id IN (${placeholders})`,
    roster_ids
  );
  const mapa = {};
  rows.forEach((r) => { mapa[r.id] = r.equipo_inscrito_id; });
  return mapa;
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, eliminar,
  listarRosterPorEquipo,
  listarPosicionesRoster, guardarPosicionesRoster,
  listarRosterPorJugador, obtenerPerfilContactoPorRoster,
  agregarARoster, actualizarRoster, eliminarDeRoster,
  obtenerEquiposDeRoster,
};