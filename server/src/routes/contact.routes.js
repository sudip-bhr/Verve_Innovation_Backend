const express = require('express');
const { submitContact, getSubmissions, updateStatus, deleteContact } = require('../controllers/contact.controller');
const { contactFormLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const adminAuth = require('../middleware/adminAuth');
const { body } = require('express-validator');

const router = express.Router();

// Public route with validation and rate limiting
router.post(
  '/',
  contactFormLimiter,
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validate,
  submitContact
);

// Admin routes
router.get('/', adminAuth(), getSubmissions);
router.patch('/:id/status', adminAuth(), updateStatus);
router.delete('/:id', adminAuth('owner'), deleteContact);

module.exports = router;
