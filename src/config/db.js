const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool único compartido por todos los módulos. Cada model hace
// pool.query(...) o pool.execute(...) — nunca abre su propia conexión.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // evita conversiones raras de fechas a objetos Date con zona horaria
});

module.exports = pool;
