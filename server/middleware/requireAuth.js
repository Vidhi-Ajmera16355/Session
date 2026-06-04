const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: requireAuth
 *
 * 1. Extracts JWT from HTTP-only cookie named "token".
 * 2. Verifies the token signature.
 * 3. Fetches the user from DB.
 * 4. Enforces single-device login by comparing sessionId in the
 *    JWT payload against user.activeSessionId in the database.
 * 5. Attaches `req.user` for downstream handlers.
 */
const requireAuth = async (req, res, next) => {
  try {
    // 1. Extract token from cookie
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // 2. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Handle specific JWT errors
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }

    // 3. Fetch user from database — lean() returns a plain object (2-5× faster than a Mongoose doc)
    //    Only select fields needed for auth checks and downstream handlers.
    const user = await User.findById(decoded.userId)
      .select('name email access activeSessionId createdAt')
      .lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // 4. Single-device enforcement: compare session IDs
    if (decoded.sessionId !== user.activeSessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session invalidated. You have logged in from another device.',
      });
    }

    // 5. Attach plain user object to request (password never selected)
    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

module.exports = requireAuth;
