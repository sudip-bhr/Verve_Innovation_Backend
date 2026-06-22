const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active testimonials
// @route   GET /api/testimonials
exports.getTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ isActive: true });
  res.json({ success: true, data: testimonials });
});

// @desc    Create a testimonial
// @route   POST /api/testimonials
exports.createTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  res.status(201).json({ success: true, data: testimonial });
});

// @desc    Update a testimonial
// @route   PUT /api/testimonials/:id
exports.updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!testimonial) {
    return res.status(404).json({ success: false, message: 'Testimonial not found' });
  }
  res.json({ success: true, data: testimonial });
});

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
exports.deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) {
    return res.status(404).json({ success: false, message: 'Testimonial not found' });
  }
  res.json({ success: true, message: 'Testimonial deleted' });
});
