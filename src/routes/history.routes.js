const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/history.controller');

router.use(authMiddleware);

router.get('/my', roleMiddleware('paciente'), controller.getMyHistory);
router.get('/doctor/patients', roleMiddleware('medico'), controller.getDoctorPatients);
router.get('/patient/:patientId', roleMiddleware('admin', 'medico', 'paciente'), controller.getPatientHistory);

module.exports = router;
