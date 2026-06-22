const CompanyStat = require('../models/CompanyStat');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all company stats
// @route   GET /api/stats
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await CompanyStat.find({});
  res.json({ success: true, data: stats });
});

// @desc    Update stats (upsert by key)
// @route   PUT /api/stats
exports.updateStats = asyncHandler(async (req, res) => {
  const { stats } = req.body; // expects array of { key, value, suffix, label }

  if (!Array.isArray(stats)) {
    return res.status(400).json({ success: false, message: 'Stats must be an array' });
  }

  const results = await Promise.all(
    stats.map((stat) =>
      CompanyStat.findOneAndUpdate(
        { key: stat.key },
        stat,
        { new: true, upsert: true, runValidators: true }
      )
    )
  );

  res.json({ success: true, data: results });
});
