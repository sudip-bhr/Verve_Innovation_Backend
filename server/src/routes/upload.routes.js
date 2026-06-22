const express = require('express');
const upload = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../controllers/upload.controller');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.post('/', adminAuth(), upload.single('image'), uploadImage);
router.delete('/:filename', adminAuth(), deleteImage);

module.exports = router;
