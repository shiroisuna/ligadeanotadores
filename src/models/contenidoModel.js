const pool = require('../config/db');

async function obtener() {
  const [rows] = await pool.execute('SELECT * FROM contenido_sitio WHERE id = 1');
  return rows[0] || null;
}

const CAMPOS = [
  'vision', 'mision',
  'contacto_direccion', 'contacto_telefono', 'contacto_email',
  'contacto_facebook', 'contacto_instagram', 'contacto_whatsapp',
  'pago_movil_banco', 'pago_movil_cedula', 'pago_movil_telefono', 'mensualidad_monto',
];

async function actualizar(datos) {
  const sets = [];
  const valores = [];
  for (const campo of CAMPOS) {
    if (datos[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      valores.push(datos[campo] || null);
    }
  }
  if (!sets.length) return obtener();
  await pool.execute(`UPDATE contenido_sitio SET ${sets.join(', ')} WHERE id = 1`, valores);
  return obtener();
}

module.exports = { obtener, actualizar };
