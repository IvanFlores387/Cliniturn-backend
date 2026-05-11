const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/consultations.controller');
const {
  validateCreateConsultation,
  validateUpdateConsultation,
} = require('../validators/consultation.validation');

router.use(authMiddleware);

router.post('/', roleMiddleware('medico'), validateCreateConsultation, controller.create);
router.get('/appointment/:appointmentId', roleMiddleware('admin', 'medico', 'paciente'), controller.getByAppointmentId);
router.get('/patient/:patientId', roleMiddleware('admin', 'medico', 'paciente'), controller.getByPatientId);
router.get('/:id', roleMiddleware('admin', 'medico', 'paciente'), controller.getById);
router.put('/:id', roleMiddleware('medico'), validateUpdateConsultation, controller.update);

module.exports = router;
