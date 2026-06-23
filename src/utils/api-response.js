function ok(res, data = null, message = 'Operación exitosa', status = 200, meta = null) {
  const body = {
    ok: true,
    message,
    data,
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(status).json(body);
}

function fail(res, message = 'Error en la operación', status = 400, error = null) {
  const body = {
    ok: false,
    message,
  };

  if (error) {
    body.error = error;
  }

  return res.status(status).json(body);
}

module.exports = { ok, fail };
