const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

// Rate limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
});

// POST /api/auth/register
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, authController.login);

// POST /api/auth/google
router.post('/google', authLimiter, authController.googleLogin);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', authLimiter, authController.resetPassword);

// POST /api/auth/logout (requireAuth is optional here — best effort)
router.post('/logout', requireAuth, authController.logout);

// GET /api/auth/me — get current user info
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
