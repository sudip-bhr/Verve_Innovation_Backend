const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AdminUser = require('../models/AdminUser');
const { verifyPassword } = require('../utils/password');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminUser = await AdminUser.findOne({ email }).select('+passwordHash');
    if (!adminUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check lock status
    if (adminUser.lockedUntil && adminUser.lockedUntil > Date.now()) {
      return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
    }

    const isValid = await verifyPassword(password, adminUser.passwordHash);

    if (!isValid) {
      adminUser.failedLoginAttempts += 1;
      if (adminUser.failedLoginAttempts >= 5) {
        adminUser.lockedUntil = Date.now() + 15 * 60 * 1000; // lock for 15 mins
      }
      await adminUser.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success
    adminUser.failedLoginAttempts = 0;
    adminUser.lockedUntil = undefined;
    adminUser.lastLoginAt = Date.now();
    await adminUser.save();

    // Issue JWT
    const token = jwt.sign(
      { sub: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Issue CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('verve_admin_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    });

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'None' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 8
    });

    res.json({ success: true, role: adminUser.role });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.logout = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('verve_admin_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'lax',
    path: '/'
  });
  res.clearCookie('csrf_token', {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'None' : 'lax',
    path: '/'
  });
  res.json({ success: true });
};

exports.getMe = async (req, res) => {
  try {
    const adminUser = await AdminUser.findById(req.adminId).select('email role lastLoginAt');
    if (!adminUser) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ success: true, data: adminUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
