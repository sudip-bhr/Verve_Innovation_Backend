const express = require('express');
const { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/testimonial.controller');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.route('/').get(getTestimonials).post(adminAuth(), createTestimonial);
router.route('/:id').put(adminAuth(), updateTestimonial).delete(adminAuth('owner'), deleteTestimonial);

module.exports = router;
