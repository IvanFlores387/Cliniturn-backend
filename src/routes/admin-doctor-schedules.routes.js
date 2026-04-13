const express = require('express');
const router = express.Router({ mergeParams: true });

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/admin-doctor-schedules.controller');
const {
  validateDoctorId,
  validateCreateSchedule,
  validateUpdateSchedule,
  validateDeleteSchedule,
} = require('../validators/admin-doctor-schedule.validation');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get(
  '/',
  validateDoctorId,
  controller.getAll
);

router.post(
  '/',
  validateDoctorId,
  validateCreateSchedule,
  controller.create
);

router.put(
  '/:scheduleId',
  validateDoctorId,
  validateUpdateSchedule,
  controller.update
);

router.delete(
  '/:scheduleId',
  validateDeleteSchedule,
  controller.remove
);

module.exports = router;