const pool = require('../config/db');

function periodoActual() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

async function obtenerPagoDelPeriodo(jugador_id, periodo) {
  const [rows] = await pool.execute(
    'SELECT * FROM pagos_mensualidad WHERE jugador_id = ? AND periodo = ?',
    [jugador_id, periodo]
  );
  return rows[0] || null;
}

async function registrar({ jugador_id, referencia, telefono_origen, fecha_pago }) {
  const periodo = periodoActual();
  await pool.execute(
    `INSERT INTO pagos_mensualidad (jugador_id, periodo, referencia, telefono_origen, fecha_pago)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE referencia = VALUES(referencia), telefono_origen = VALUES(telefono_origen), fecha_pago = VALUES(fecha_pago)`,
    [jugador_id, periodo, referencia, telefono_origen, fecha_pago]
  );
  return obtenerPagoDelPeriodo(jugador_id, periodo);
}

async function listar(periodo) {
  const condiciones = [];
  const valores = [];
  if (periodo) { condiciones.push('p.periodo = ?'); valores.push(periodo); }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT p.*, j.nombres, j.apellidos
     FROM pagos_mensualidad p
     JOIN jugadores j ON j.id = p.jugador_id
     ${where}
     ORDER BY p.periodo DESC, p.creado_en DESC`,
    valores
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await pool.execute('SELECT * FROM pagos_mensualidad WHERE id = ?', [id]);
  return rows[0] || null;
}

async function eliminar(id) {
  await pool.execute('DELETE FROM pagos_mensualidad WHERE id = ?', [id]);
}

module.exports = { periodoActual, obtenerPagoDelPeriodo, registrar, listar, obtenerPorId, eliminar };
