const express = require('express');
const {
  getServices,
  getServiceBySlug,
  createService,
  updateService,
  deleteService,
} = require('../controllers/service.controller');
const adminAuth = require('../middleware/adminAuth');
const cacheControl = require('../middleware/cacheControl');

const router = express.Router();

router.route('/').get(cacheControl('public, max-age=300'), getServices).post(adminAuth(), createService);
router.route('/:slug').get(getServiceBySlug);
router.route('/:id').put(adminAuth(), updateService).delete(adminAuth('owner'), deleteService);

module.exports = router;
