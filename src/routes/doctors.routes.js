const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const doctorsRepository = require('../repositories/doctors.repository');
const { ok, fail } = require('../utils/api-response');
const availabilityController = require('../controllers/appointments.controller');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const data = await doctorsRepository.findAllActiveBySpecialty(req.query.specialtyId);
    return ok(res, data, 'Médicos obtenidos correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/:id/availability', availabilityController.getAvailability);

module.exports = router;