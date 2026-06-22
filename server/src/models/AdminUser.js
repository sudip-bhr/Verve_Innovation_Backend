const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  passwordHash: { 
    type: String, 
    required: true,
    select: false // Excluded from queries by default
  },
  role: { 
    type: String, 
    enum: ['owner', 'editor'], 
    default: 'editor' 
  },
  lastLoginAt: Date,
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockedUntil: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminUser', adminUserSchema);
