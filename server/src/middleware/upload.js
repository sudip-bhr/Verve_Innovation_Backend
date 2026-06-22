const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }

  // Allow 3D models (common mime types and extensions for glb, gltf, obj)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed3DExts = ['.glb', '.gltf', '.obj'];
  const allowed3DMimeTypes = [
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
    'text/plain' // obj is sometimes sent as plain text
  ];

  if (allowed3DExts.includes(ext) || allowed3DMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Only images and 3D models (.glb, .gltf, .obj) are allowed'), false);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Increase limit to 50MB for 3D models
  fileFilter: fileFilter
});

module.exports = upload;
