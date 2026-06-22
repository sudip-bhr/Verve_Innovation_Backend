const CaseStudy = require('../models/CaseStudy');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active case studies (with optional category filter + count mode)
// @route   GET /api/cases
exports.getCaseStudies = asyncHandler(async (req, res) => {
  const { categories, count } = req.query;

  // Count-only mode for navbar badge
  if (count === 'true') {
    const total = await CaseStudy.countDocuments({ isActive: true });
    return res.json({ success: true, count: total });
  }

  let filter = { isActive: true };

  // Multi-tag category filter: show cases containing ANY of the requested categories
  if (categories) {
    const cats = categories.split(',').map((c) => c.trim());
    filter.categories = { $in: cats };
  }

  const cases = await CaseStudy.find(filter)
    .select('title slug categories clientIndustry summary tags coverImage coverVideo layout isFeatured order') // excludes full description/gallery for list view
    .sort({ order: 1 });
  res.json({ success: true, data: cases });
});

// @desc    Get single case study by slug
// @route   GET /api/cases/:slug
exports.getCaseStudyBySlug = asyncHandler(async (req, res) => {
  const caseStudy = await CaseStudy.findOne({ slug: req.params.slug, isActive: true });
  if (!caseStudy) {
    return res.status(404).json({ success: false, message: 'Case study not found' });
  }
  res.json({ success: true, data: caseStudy });
});

// @desc    Create a case study
// @route   POST /api/cases
exports.createCaseStudy = asyncHandler(async (req, res) => {
  const caseStudy = await CaseStudy.create(req.body);
  res.status(201).json({ success: true, data: caseStudy });
});

// @desc    Update a case study
// @route   PUT /api/cases/:id
exports.updateCaseStudy = asyncHandler(async (req, res) => {
  const caseStudy = await CaseStudy.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!caseStudy) {
    return res.status(404).json({ success: false, message: 'Case study not found' });
  }
  res.json({ success: true, data: caseStudy });
});

// @desc    Delete a case study
// @route   DELETE /api/cases/:id
exports.deleteCaseStudy = asyncHandler(async (req, res) => {
  const caseStudy = await CaseStudy.findByIdAndDelete(req.params.id);
  if (!caseStudy) {
    return res.status(404).json({ success: false, message: 'Case study not found' });
  }
  res.json({ success: true, message: 'Case study deleted' });
});
