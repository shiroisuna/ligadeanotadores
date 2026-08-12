const multer = require('multer');
const path = require('path');
const fs = require('fs');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5MB

function crearStorage(subcarpeta) {
  // backend/uploads/<subcarpeta> — al mismo nivel que src/, no dentro
  const carpeta = path.join(__dirname, '..', '..', 'uploads', subcarpeta);
  fs.mkdirSync(carpeta, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpeta),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, nombreUnico);
    },
  });
}

function filtroImagen(req, file, cb) {
  if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
    const err = new Error('Solo se permiten imágenes (jpg, png, webp o gif)');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

// Uso: const uploadLogo = crearUploader('logos'); router.post('/x', uploadLogo.single('imagen'), ...)
function crearUploader(subcarpeta) {
  return multer({
    storage: crearStorage(subcarpeta),
    fileFilter: filtroImagen,
    limits: { fileSize: TAMANO_MAXIMO },
  });
}

module.exports = { crearUploader };
