const express = require('express');

const authRoutes = require('./auth.routes');
const serviceRoutes = require('./service.routes');
const caseStudyRoutes = require('./caseStudy.routes');
const teamRoutes = require('./team.routes');
const testimonialRoutes = require('./testimonial.routes');
const statRoutes = require('./stat.routes');
const contactRoutes = require('./contact.routes');
const uploadRoutes = require('./upload.routes');
const blogRoutes = require('./blog.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/cases', caseStudyRoutes);
router.use('/team', teamRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/stats', statRoutes);
router.use('/contact', contactRoutes);
router.use('/upload', uploadRoutes);
router.use('/blogs', blogRoutes);

module.exports = router;
