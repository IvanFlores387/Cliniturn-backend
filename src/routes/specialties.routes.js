const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const db = require('../config/db');
const { ok, fail } = require('../utils/api-response');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM specialties
      WHERE activo = 1
      ORDER BY nombre ASC
    `);

    return ok(res, rows, 'Especialidades obtenidas correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

module.exports = router;