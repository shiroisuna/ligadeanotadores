const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');

async function login(email, password) {
  const usuario = await authModel.buscarPorEmail(email);
  if (!usuario) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const payload = {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    jugador_id: usuario.jugador_id,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return { token, usuario: payload };
}

module.exports = { login };
