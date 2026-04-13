function ok(res, data = null, message = 'Operación exitosa', status = 200) {
  return res.status(status).json({
    ok: true,
    message,
    data,
  });
}
//cola
function fail(res, message = 'Error en la operación', status = 400, error = null) {
  return res.status(status).json({
    ok: false,
    message,
    error,
  });
}

module.exports = { ok, fail };