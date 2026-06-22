const mongoose = require('mongoose');
mongoose.set('sanitizeFilter', true); // Prevent NoSQL injection

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 defaults are fine, no need for deprecated options
    });
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`✗ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
