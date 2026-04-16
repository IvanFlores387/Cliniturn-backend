const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const doctorsRepository = require('../repositories/doctors.repository');
const availabilityService = require('../services/availability.service');
const { ok, fail } = require('../utils/api-response');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const data = await doctorsRepository.findAllActiveBySpecialty(req.query.specialtyId);
    return ok(res, data, 'Médicos obtenidos correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return fail(res, 'La fecha es obligatoria.', 400);
    }

    const data = await availabilityService.getDoctorAvailability(id, date);
    return ok(res, data, 'Disponibilidad obtenida correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

module.exports = router;