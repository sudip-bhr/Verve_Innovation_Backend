const express = require('express');
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
} = require('../controllers/blog.controller');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.route('/').get(getBlogs).post(adminAuth(), createBlog);
router.route('/:slug').get(getBlogBySlug);
router.route('/:id').put(adminAuth(), updateBlog).delete(adminAuth('owner'), deleteBlog);

module.exports = router;
