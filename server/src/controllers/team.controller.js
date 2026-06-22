const TeamMember = require('../models/TeamMember');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active team members
// @route   GET /api/team
exports.getTeamMembers = asyncHandler(async (req, res) => {
  const members = await TeamMember.find({ isActive: true })
    .select('name role tagline photo order')
    .sort({ order: 1 });
  res.json({ success: true, data: members });
});

// @desc    Create a team member
// @route   POST /api/team
exports.createTeamMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.create(req.body);
  res.status(201).json({ success: true, data: member });
});

// @desc    Update a team member
// @route   PUT /api/team/:id
exports.updateTeamMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!member) {
    return res.status(404).json({ success: false, message: 'Team member not found' });
  }
  res.json({ success: true, data: member });
});

// @desc    Delete a team member
// @route   DELETE /api/team/:id
exports.deleteTeamMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, message: 'Team member not found' });
  }
  res.json({ success: true, message: 'Team member deleted' });
});
