const Blog = require('../models/Blog');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all blogs
// @route   GET /api/blogs
exports.getBlogs = asyncHandler(async (req, res) => {
  const { published } = req.query;
  const filter = {};
  
  if (published === 'true') {
    filter.isPublished = true;
  }

  const blogs = await Blog.find(filter)
    .select('title slug summary coverImage authorName tags isPublished createdAt')
    .sort({ createdAt: -1 });
    
  res.json({ success: true, data: blogs });
});

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
exports.getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug });
  if (!blog) {
    return res.status(404).json({ success: false, message: 'Blog not found' });
  }
  
  // If not published, only allow access if we skip this check (e.g., admin preview)
  // Simple check for now
  
  res.json({ success: true, data: blog });
});

// @desc    Create a blog
// @route   POST /api/blogs
exports.createBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.create(req.body);
  res.status(201).json({ success: true, data: blog });
});

// @desc    Update a blog
// @route   PUT /api/blogs/:id
exports.updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!blog) {
    return res.status(404).json({ success: false, message: 'Blog not found' });
  }
  res.json({ success: true, data: blog });
});

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
exports.deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) {
    return res.status(404).json({ success: false, message: 'Blog not found' });
  }
  res.json({ success: true, message: 'Blog deleted' });
});
