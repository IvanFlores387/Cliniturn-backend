function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const value = Number(req.params[paramName]);

    if (!Number.isInteger(value) || value <= 0) {
      return res.status(400).json({
        ok: false,
        message: `El parámetro ${paramName} debe ser un número entero positivo.`,
      });
    }

    next();
  };
}

module.exports = validateIdParam;
