const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * JWT authentication guard for admin routes.
 * Scaffolded for future admin panel — not enforced in Phase 1.
 */

function adminAuth(requiredRole = null) {
  return (req, res, next) => {
    const token = req.cookies.verve_admin_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole && payload.role !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      req.adminId = payload.sub;
      req.adminRole = payload.role;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  };
}

module.exports = adminAuth;
