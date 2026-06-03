const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Registration = require('../models/Registration');

// Helper: generate JWT and set HTTP-only cookie
const signTokenAndSetCookie = (user, sessionId, res) => {
  const token = jwt.sign(
    { userId: user._id, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
    path: '/',
  });

  return token;
};

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Generate unique session ID for single-device enforcement
    const sessionId = crypto.randomUUID();

    // Check if user already has a confirmed registration
    const confirmedReg = await Registration.findOne({
      email: email.toLowerCase(),
      status: 'confirmed',
    });

    // Create user (password is hashed by pre-save hook)
    const user = new User({
      name,
      email,
      password,
      activeSessionId: sessionId,
      access: !!confirmedReg,
    });
    await user.save();

    // Sign JWT and set cookie
    signTokenAndSetCookie(user, sessionId, res);

    // Fetch user registrations
    const registrations = await Registration.find({ email: email.toLowerCase() }).select('-__v');

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        access: user.access,
        registrations,
      },
    });
  } catch (err) {
    console.error('Register error:', err);

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate NEW session ID → automatically invalidates previous devices
    const sessionId = crypto.randomUUID();
    user.activeSessionId = sessionId;
    await user.save({ validateBeforeSave: false });

    // Sign JWT and set cookie
    signTokenAndSetCookie(user, sessionId, res);

    // Fetch their registrations
    const registrations = await Registration.find({ email: user.email.toLowerCase() }).select('-__v');

    res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        access: user.access,
        registrations,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // If we have a valid user, nullify their active session
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { activeSessionId: null });
    }

    // Clear the cookie
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      expires: new Date(0),
      path: '/',
    });

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during logout.',
    });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's info.
 */
exports.getMe = async (req, res) => {
  try {
    const registrations = await Registration.find({ email: req.user.email.toLowerCase() }).select('-__v');

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        access: req.user.access,
        createdAt: req.user.createdAt,
        registrations,
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};
