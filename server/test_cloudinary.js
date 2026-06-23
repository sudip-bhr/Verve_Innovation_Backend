require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const fs = require('fs');
const path = require('path');

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

(async () => {
  try {
    const buffer = fs.readFileSync(path.join(__dirname, '../../Verve_Innovation/client/public/OG-IMAGE.svg'));
    console.log("Uploading test image...");
    const result = await uploadToCloudinary(buffer);
    console.log("Success:", result.secure_url);
  } catch (error) {
    console.error("Cloudinary Error:", error);
    console.log("Http code:", error.http_code);
  }
})();
