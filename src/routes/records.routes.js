const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/records.controller');

router.use(authMiddleware);

router.get('/my', roleMiddleware('paciente'), controller.getMy);
router.get('/patient/:patientId', roleMiddleware('admin', 'medico', 'paciente'), controller.getByPatientId);
router.get('/:id', roleMiddleware('admin', 'medico', 'paciente'), controller.getById);
router.get('/', roleMiddleware('admin', 'medico'), controller.getAll);

module.exports = router;
