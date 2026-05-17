const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/reports.controller');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/summary', controller.summary);
router.get('/appointments-by-specialty', controller.appointmentsBySpecialty);
router.get('/appointments-by-doctor', controller.appointmentsByDoctor);
router.get('/appointments-by-month', controller.appointmentsByMonth);
router.get('/cancellation-rate', controller.cancellationRate);

module.exports = router;
