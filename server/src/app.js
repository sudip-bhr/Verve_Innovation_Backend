const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes');
const seoRoutes = require('./routes/seo.routes');
const errorHandler = require('./middleware/errorHandler');
const { globalApiLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Global Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5001", "http://localhost:5173", process.env.CLIENT_ORIGIN || "http://localhost:5173"], 
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", process.env.CLIENT_ORIGIN || 'http://localhost:5173']
    }
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true }
}));

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};
app.use(cors(corsOptions));

app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies
app.use(compression()); // Gzip compression

// Serve static uploads folder
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

if (env.nodeEnv === 'development') {
  app.use(morgan('dev')); // Logging
}

// CSRF Validation Middleware
const csrfCheck = (req, res, next) => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutatingMethods.includes(req.method)) {
    // Skip CSRF for login/logout and public contact
    if (req.path.startsWith('/api/auth/') || req.path === '/api/contact') {
      return next();
    }
    
    // If the user has an admin token, enforce CSRF
    if (req.cookies && req.cookies.verve_admin_token) {
      const cookieToken = req.cookies.csrf_token;
      const headerToken = req.headers['x-csrf-token'];
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'CSRF token missing or invalid' });
      }
    }
  }
  next();
};
app.use(csrfCheck);

// Global Rate Limiting
app.use('/api/', globalApiLimiter);

// Mount SEO Routes (Root Level)
app.use('/', seoRoutes);

// Mount API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
