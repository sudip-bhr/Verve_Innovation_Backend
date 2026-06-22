const ContactSubmission = require('../models/ContactSubmission');
const asyncHandler = require('../utils/asyncHandler');
const { sendContactNotification } = require('../utils/mailer');

// @desc    Submit a contact form
// @route   POST /api/contact
exports.submitContact = asyncHandler(async (req, res) => {
  const submission = await ContactSubmission.create(req.body);

  // Send email notification (non-blocking — don't fail the response if mail fails)
  sendContactNotification(submission).catch((err) => {
    console.error('✗ Failed to send notification email:', err.message);
  });

  res.status(201).json({
    success: true,
    message: 'Thank you! We\'ll be in touch soon.',
    data: { id: submission._id },
  });
});

// @desc    Get all contact submissions (Admin)
// @route   GET /api/contact
exports.getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: submissions });
});

// @desc    Update submission status
// @route   PATCH /api/contact/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'contacted', 'closed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const submission = await ContactSubmission.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  res.json({ success: true, data: submission });
});

// @desc    Delete a contact submission
// @route   DELETE /api/contact/:id
exports.deleteContact = asyncHandler(async (req, res) => {
  const submission = await ContactSubmission.findByIdAndDelete(req.params.id);
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  res.json({ success: true, message: 'Submission deleted' });
});
