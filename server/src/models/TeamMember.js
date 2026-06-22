const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team member name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
    },
    tagline: {
      type: String,
      default: '',
    },
    photo: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Performance indexes
teamMemberSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
