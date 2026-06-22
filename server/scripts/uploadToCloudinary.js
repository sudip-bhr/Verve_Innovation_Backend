require('dotenv').config({ path: '../.env' });
const cloudinary = require('../src/config/cloudinary');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '../../client/src/assets/logo');

const filesToUpload = [
  'Dark_Theme_Logo.svg',
  'Light_Theme_Logo.svg'
];

async function uploadFiles() {
  const results = {};

  for (const file of filesToUpload) {
    const filePath = path.join(publicDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    console.log(`Uploading ${file}...`);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
      console.log(`Successfully uploaded ${file}:`);
      results[file] = result.secure_url;
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error);
    }
  }

  console.log('\n--- Upload Summary ---');
  console.log(JSON.stringify(results, null, 2));
}

uploadFiles();
