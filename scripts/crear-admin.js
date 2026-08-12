// Genera el INSERT listo para pegar en phpMyAdmin, con el password ya
// encriptado (nunca se guarda en texto plano en la base de datos).
//
// Uso:
//   node scripts/crear-admin.js correo@ejemplo.com miPasswordSeguro
//
const bcrypt = require('bcryptjs');

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Uso: node scripts/crear-admin.js <email> <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\nCopia y pega esto en phpMyAdmin, pestaña SQL, en tu base liga_beisbol_softbol:\n');
console.log(
  `INSERT INTO usuarios (email, password_hash, rol) VALUES ('${email}', '${hash}', 'administrador');`
);
console.log('\nLuego inicia sesión en el sitio con:');
console.log(`  Correo: ${email}`);
console.log(`  Password: ${password}\n`);
