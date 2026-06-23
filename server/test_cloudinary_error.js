const cloudinary = require('./src/config/cloudinary');
const fs = require('fs');
const path = require('path');

// Break the API key
cloudinary.config({ api_key: 'invalid' });

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
    await uploadToCloudinary(buffer);
  } catch (error) {
    console.log("Error properties:", Object.keys(error));
    console.log("statusCode:", error.statusCode);
    console.log("http_code:", error.http_code);
    console.log("name:", error.name);
    console.log("message:", error.message);
  }
})();
