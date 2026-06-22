const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');

// @desc    Upload an image or 3D model
// @route   POST /api/upload
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
  };

  const result = await uploadToCloudinary(req.file.buffer);

  res.status(200).json({
    success: true,
    data: {
      url: result.secure_url,
      filename: result.public_id,
      resource_type: result.resource_type,
      format: result.format
    }
  });
});

// @desc    Delete an image or 3D model
// @route   DELETE /api/upload/:filename
exports.deleteImage = asyncHandler(async (req, res) => {
  // filename in this context is the public_id of the file on Cloudinary
  const { filename } = req.params;

  if (!filename) {
    return res.status(400).json({ success: false, message: 'Public ID (filename) is required' });
  }

  // Cloudinary destroy sometimes needs the resource_type if it is 'raw' or 'video'
  // But usually, standard images and 3D glb models uploaded with auto end up as 'image'
  // If it fails, one might need to specify resource_type explicitly. By default it is 'image'.
  const result = await cloudinary.uploader.destroy(filename);

  if (result.result === 'ok' || result.result === 'not found') {
    res.json({ success: true, message: 'File deleted successfully or not found' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete file from Cloudinary', result });
  }
});
