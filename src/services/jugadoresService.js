const jugadoresModel = require('../models/jugadoresModel');

function noEncontrado(mensaje) {
  const err = new Error(mensaje);
  err.status = 404;
  return err;
}

// null si no hay fecha (no asumimos mayor de edad por defecto)
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumple = hoy.getMonth() < nacimiento.getMonth()
    || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (aunNoCumple) edad--;
  return edad;
}

// Si es menor de edad (o no se sabe su fecha de nacimiento — más
// conservador es no mostrar), se oculta el contacto sin importar quién
// pregunte, admin incluido.
function ocultarContactoSiMenor(persona) {
  const edad = calcularEdad(persona.fecha_nacimiento);
  if (edad === null || edad < 18) {
    return { ...persona, edad, email: null, telefono: null, es_menor: true };
  }
  return { ...persona, edad, es_menor: false };
}

async function listar() {
  return jugadoresModel.listar();
}

async function obtener(id) {
  const jugador = await jugadoresModel.obtenerPorId(id);
  if (!jugador) throw noEncontrado('Jugador no encontrado');
  return ocultarContactoSiMenor(jugador);
}

async function crear(datos) {
  if (!datos.nombres || !datos.apellidos) {
    const err = new Error('nombres y apellidos son requeridos');
    err.status = 400;
    throw err;
  }
  const edad = calcularEdad(datos.fecha_nacimiento);
  const datosSeguros = (edad === null || edad < 18)
    ? { ...datos, email: null, telefono: null }
    : datos;
  return jugadoresModel.crear(datosSeguros);
}

async function actualizar(id, datos) {
  await obtener(id); // valida que exista (ya trae edad/es_menor calculados, pero usamos datos frescos abajo)
  const edad = calcularEdad(datos.fecha_nacimiento);
  const datosSeguros = (edad === null || edad < 18)
    ? { ...datos, email: null, telefono: null }
    : datos;
  return jugadoresModel.actualizar(id, datosSeguros);
}

async function eliminar(id) {
  await obtener(id);
  return jugadoresModel.eliminar(id);
}

// ---- roster ----

async function listarRosterPorEquipo(equipo_inscrito_id) {
  if (!equipo_inscrito_id) {
    const err = new Error('equipo_inscrito_id es requerido');
    err.status = 400;
    throw err;
  }
  return jugadoresModel.listarRosterPorEquipo(equipo_inscrito_id);
}

async function agregarARoster(datos) {
  if (!datos.jugador_id || !datos.equipo_inscrito_id) {
    const err = new Error('jugador_id y equipo_inscrito_id son requeridos');
    err.status = 400;
    throw err;
  }
  return jugadoresModel.agregarARoster(datos);
}

async function obtenerRoster(id) {
  const item = await jugadoresModel.obtenerRosterPorId(id);
  if (!item) throw noEncontrado('Registro de roster no encontrado');
  return item;
}

async function actualizarRoster(id, datos) {
  await obtenerRoster(id);
  return jugadoresModel.actualizarRoster(id, datos);
}

async function eliminarDeRoster(id) {
  await obtenerRoster(id);
  return jugadoresModel.eliminarDeRoster(id);
}

async function misEquipos(jugador_id) {
  if (!jugador_id) {
    const err = new Error('Esta cuenta no está vinculada a un jugador');
    err.status = 400;
    throw err;
  }
  return jugadoresModel.listarRosterPorJugador(jugador_id);
}

// Perfil con datos de contacto — solo el admin, o el propio jugador dueño
// de ese roster (comparado contra su jugador_id del token, no la URL).
async function perfilContacto(roster_id, usuario) {
  const perfil = await jugadoresModel.obtenerPerfilContactoPorRoster(roster_id);
  if (!perfil) {
    const err = new Error('Roster no encontrado');
    err.status = 404;
    throw err;
  }
  const esDueño = usuario.rol === 'jugador' && usuario.jugador_id === perfil.jugador_id;
  if (usuario.rol !== 'administrador' && !esDueño) {
    const err = new Error('No tienes permiso para ver este perfil');
    err.status = 403;
    throw err;
  }
  return ocultarContactoSiMenor(perfil);
}

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarRosterPorEquipo, agregarARoster, obtenerRoster, actualizarRoster, eliminarDeRoster,
  misEquipos, perfilContacto,
};
