const mongoose = require('mongoose');

const caseStudySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Case study title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    // Multi-tag categories (from Becklyn analysis — NOT single enum)
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          const allowed = ['Digital Products', 'Software', 'Mobile', 'Marketing'];
          return v.every((cat) => allowed.includes(cat));
        },
        message: 'Categories must be one of: Digital Products, Software, Mobile, Marketing',
      },
    },
    clientIndustry: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default: '',
    },
    gallery: {
      type: [String],
      default: [],
    },
    layout: {
      type: String,
      enum: ['grid', 'feature'],
      default: 'grid',
    },
    isFeatured: {
      type: Boolean,
      default: true,
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

// Auto-generate slug from title
caseStudySchema.pre('validate', function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Performance indexes
caseStudySchema.index({ categories: 1 }); // supports multi-tag filter
caseStudySchema.index({ isActive: 1, order: 1 }); // compound index for the common 'active, sorted' query

module.exports = mongoose.model('CaseStudy', caseStudySchema);
