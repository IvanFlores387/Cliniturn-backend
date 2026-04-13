const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/admin-doctors.controller');
const schedulesRoutes = require('./admin-doctor-schedules.routes');
const {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateToggleDoctor,
} = require('../validators/admin-doctor.validation');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateCreateDoctor, controller.create);
router.put('/:id', validateUpdateDoctor, controller.update);
router.patch('/:id/toggle', validateToggleDoctor, controller.toggleStatus);

// Horarios por médico
router.use('/:doctorId/schedules', schedulesRoutes);

module.exports = router;