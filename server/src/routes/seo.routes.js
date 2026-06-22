const express = require('express');
const { generateSitemap, getRobotsTxt } = require('../controllers/seo.controller');

const router = express.Router();

// Serve dynamic sitemap
router.get('/sitemap.xml', generateSitemap);

// Serve dynamic robots.txt
router.get('/robots.txt', getRobotsTxt);

module.exports = router;
