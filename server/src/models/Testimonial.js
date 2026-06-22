const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    quote: {
      type: String,
      required: [true, 'Testimonial quote is required'],
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
    },
    authorRole: {
      type: String,
      default: '',
    },
    authorCompany: {
      type: String,
      default: '',
    },
    authorPhoto: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
