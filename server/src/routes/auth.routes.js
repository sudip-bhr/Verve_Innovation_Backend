const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/auth.controller');

const adminAuth = require('../middleware/adminAuth');

router.post('/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1, max: 100 })
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);
router.get('/me', adminAuth(), authController.getMe);

module.exports = router;
