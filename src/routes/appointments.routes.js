const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { validateCreateAppointment } = require('../validators/appointment.validation');
const controller = require('../controllers/appointments.controller');

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware('paciente'),
  validateCreateAppointment,
  controller.create
);

router.get('/my', roleMiddleware('paciente'), controller.myAppointments);
router.get('/doctor', roleMiddleware('medico'), controller.doctorAppointments);
router.get('/', roleMiddleware('admin'), controller.allAppointments);

router.patch('/:id/confirm', roleMiddleware('medico'), controller.confirmAppointment);
router.patch('/:id/cancel', roleMiddleware('paciente', 'medico', 'admin'), controller.cancelAppointment);
router.patch('/:id/attended', roleMiddleware('medico'), controller.attendedAppointment);

module.exports = router;