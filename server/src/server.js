const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err, promise) => {
  console.error(`✗ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
