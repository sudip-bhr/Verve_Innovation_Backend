const express = require('express');
const {
  getCaseStudies,
  getCaseStudyBySlug,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
} = require('../controllers/caseStudy.controller');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.route('/').get(getCaseStudies).post(adminAuth(), createCaseStudy);
router.route('/:slug').get(getCaseStudyBySlug);
router.route('/:id').put(adminAuth(), updateCaseStudy).delete(adminAuth('owner'), deleteCaseStudy);

module.exports = router;
