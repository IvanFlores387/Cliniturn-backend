const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/dashboard.controller');

router.use(authMiddleware);

router.get('/patient', roleMiddleware('paciente'), controller.patientDashboard);
router.get('/doctor', roleMiddleware('medico'), controller.doctorDashboard);
router.get('/admin', roleMiddleware('admin'), controller.adminDashboard);

module.exports = router;