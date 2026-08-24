const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { crearUploader } = require('../middlewares/upload');

const uploadLogo = crearUploader('logos');
const uploadFoto = crearUploader('jugadores');
const uploadGaleria = crearUploader('galeria');

function responderUrl(subcarpeta) {
  return (req, res, next) => {
    if (!req.file) {
      const err = new Error('No se recibió ninguna imagen');
      err.status = 400;
      return next(err);
    }
    // URL absoluta (incluye host) para que el frontend, que corre en otro
    // puerto/origen en desarrollo, pueda usarla directo en un <img src>.
    const url = `${req.protocol}://${req.get('host')}/uploads/${subcarpeta}/${req.file.filename}`;
    res.status(201).json({ url });
  };
}

router.post(
  '/logo-equipo',
  requireAuth, requireRole('administrador'),
  uploadLogo.single('imagen'),
  responderUrl('logos')
);

router.post(
  '/foto-jugador',
  requireAuth, requireRole('administrador'),
  uploadFoto.single('imagen'),
  responderUrl('jugadores')
);

router.post(
  '/galeria',
  requireAuth, requireRole('administrador'),
  uploadGaleria.single('imagen'),
  responderUrl('galeria')
);

module.exports = router;
