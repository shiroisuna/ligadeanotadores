const pagosModel = require('../models/pagosModel');
const contenidoModel = require('../models/contenidoModel');

// Estado de pago del jugador logueado: ¿ya pagó el mes actual? + los
// datos de pago móvil / monto para mostrarle cómo pagar si no.
async function miEstado(jugador_id) {
  if (!jugador_id) {
    const err = new Error('Esta cuenta no está vinculada a un jugador');
    err.status = 400;
    throw err;
  }
  const periodo = pagosModel.periodoActual();
  const [pago, contenido] = await Promise.all([
    pagosModel.obtenerPagoDelPeriodo(jugador_id, periodo),
    contenidoModel.obtener(),
  ]);
  return {
    periodo,
    pagado: !!pago,
    pago,
    pago_movil: {
      banco: contenido?.pago_movil_banco || null,
      cedula: contenido?.pago_movil_cedula || null,
      telefono: contenido?.pago_movil_telefono || null,
      monto: contenido?.mensualidad_monto || null,
    },
  };
}

async function registrar(jugador_id, datos) {
  if (!jugador_id) {
    const err = new Error('Esta cuenta no está vinculada a un jugador');
    err.status = 400;
    throw err;
  }
  const { referencia, telefono_origen, fecha_pago } = datos;
  if (!referencia || !telefono_origen || !fecha_pago) {
    const err = new Error('referencia, telefono_origen y fecha_pago son requeridos');
    err.status = 400;
    throw err;
  }
  return pagosModel.registrar({ jugador_id, referencia, telefono_origen, fecha_pago });
}

async function listar(periodo) {
  return pagosModel.listar(periodo);
}

async function eliminar(id) {
  const pago = await pagosModel.obtenerPorId(id);
  if (!pago) {
    const err = new Error('Pago no encontrado');
    err.status = 404;
    throw err;
  }
  return pagosModel.eliminar(id);
}

module.exports = { miEstado, registrar, listar, eliminar };
