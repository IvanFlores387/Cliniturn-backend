const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const controller = require('../controllers/consultorios.controller');
const {
  validateCreateConsultorio,
  validateUpdateConsultorio,
  validateToggleConsultorio,
} = require('../validators/consultorio.validation');

router.use(authMiddleware);

// Todos los roles autenticados pueden consultar consultorios
router.get('/', roleMiddleware('admin', 'medico', 'paciente'), controller.getAll);
router.get('/:id', roleMiddleware('admin', 'medico', 'paciente'), controller.getById);

// Solo admin puede administrar
router.post('/', roleMiddleware('admin'), validateCreateConsultorio, controller.create);
router.put('/:id', roleMiddleware('admin'), validateUpdateConsultorio, controller.update);
router.patch(
  '/:id/toggle',
  roleMiddleware('admin'),
  validateToggleConsultorio,
  controller.toggleStatus
);

module.exports = router;