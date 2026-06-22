const dotenv = require('dotenv');
dotenv.config();

const requiredEnvVars = ['MONGODB_URI'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`✗ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  nodeEnv: process.env.NODE_ENV || 'development',
  mail: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || 'noreply@verveinnovation.com.np',
    notificationEmail: process.env.CONTACT_NOTIFICATION_EMAIL || 'hello@verveinnovation.com.np',
  },
};
