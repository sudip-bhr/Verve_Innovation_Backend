const app = require('./app');
const env = require('./config/env');
const mongoose = require('mongoose');

const server = app.listen(env.port, () => {
  console.log(`🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
});

// Graceful shutdown for Render
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err, promise) => {
  console.error(`✗ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
