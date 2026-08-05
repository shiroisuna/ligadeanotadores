// Cualquier controller puede hacer next(err) y termina aquí.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'El registro ya existe' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referencia inválida (revisa los IDs relacionados)' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
}

module.exports = errorHandler;
