function notFoundMiddleware(req, res) {
  return res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada.',
    path: req.originalUrl,
  });
}

module.exports = notFoundMiddleware;
