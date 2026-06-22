const express = require('express');
const { getStats, updateStats } = require('../controllers/stat.controller');
const adminAuth = require('../middleware/adminAuth');
const cacheControl = require('../middleware/cacheControl');

const router = express.Router();

router.route('/').get(cacheControl('public, max-age=300'), getStats).put(adminAuth(), updateStats);

module.exports = router;
