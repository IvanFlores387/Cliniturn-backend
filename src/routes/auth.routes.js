const express = require('express');
const router = express.Router();

const { register, login, me } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin } = require('../validators/auth.validation');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authMiddleware, me);

module.exports = router;
