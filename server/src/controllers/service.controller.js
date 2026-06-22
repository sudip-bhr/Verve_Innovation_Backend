const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active services (ordered)
// @route   GET /api/services
exports.getServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ isActive: true })
    .select('title slug shortDescription icon order') // excludes full description for list view
    .sort({ order: 1 });
  res.json({ success: true, data: services });
});

// @desc    Get single service by slug
// @route   GET /api/services/:slug
exports.getServiceBySlug = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug, isActive: true });
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, data: service });
});

// @desc    Create a service
// @route   POST /api/services
exports.createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
});

// @desc    Update a service
// @route   PUT /api/services/:id
exports.updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, data: service });
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, message: 'Service deleted' });
});
