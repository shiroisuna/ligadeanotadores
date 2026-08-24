// Genera el INSERT listo para pegar en phpMyAdmin.
//
// Uso:
//   node scripts/crear-usuario.js <email> <password> <rol>
//   Rol: administrador | anotador | jugador
//
//   Para jugador, agrega el jugador_id al final:
//   node scripts/crear-usuario.js jugador@mail.com pass jugador 5
//
const bcrypt = require('bcryptjs');

const [,, email, password, rol = 'anotador', jugador_id] = process.argv;

if (!email || !password) {
  console.error('Uso: node scripts/crear-usuario.js <email> <password> <rol> [jugador_id]');
  process.exit(1);
}

const roles = ['administrador', 'anotador', 'jugador'];
if (!roles.includes(rol)) {
  console.error(`Rol inválido. Usa uno de: ${roles.join(', ')}`);
  process.exit(1);
}

if (rol === 'jugador' && !jugador_id) {
  console.error('Para el rol jugador debes proporcionar el jugador_id al final.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const colJugador = rol === 'jugador' ? `, jugador_id` : '';
const valJugador = rol === 'jugador' ? `, ${jugador_id}` : '';

console.log('\nCopia y pega esto en phpMyAdmin, pestaña SQL:\n');
console.log(
  `INSERT INTO usuarios (email, password_hash, rol${colJugador}) VALUES ('${email}', '${hash}', '${rol}'${valJugador});`
);
console.log(`\nCredenciales: ${email} / ${password}\n`);
