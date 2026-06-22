const mongoose = require('mongoose');

const contactSubmissionSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  companyName: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  projectType: {
    type: String,
    default: '',
  },
  budgetRange: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    enum: ['contact_form', 'discovery_call', 'quote_modal'],
    default: 'contact_form',
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);
