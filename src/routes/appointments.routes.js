const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { validateCreateAppointment } = require('../validations/appointment.validation');
const controller = require('../controllers/appointments.controller');

router.use(authMiddleware);

router.get('/doctor/:id/availability', controller.getAvailability);

router.post(
  '/',
  roleMiddleware('paciente'),
  validateCreateAppointment,
  controller.create
);

router.get('/my', roleMiddleware('paciente'), controller.getMy);
router.get('/doctor', roleMiddleware('medico'), controller.getDoctor);
router.get('/', roleMiddleware('admin'), controller.getAll);

router.patch('/:id/confirm', roleMiddleware('medico'), controller.confirm);
router.patch('/:id/cancel', roleMiddleware('paciente', 'medico', 'admin'), controller.cancel);
router.patch('/:id/attended', roleMiddleware('medico'), controller.attended);

module.exports = router;