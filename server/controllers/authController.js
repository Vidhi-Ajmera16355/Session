const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Registration = require('../models/Registration');
const sendEmail = require('../utils/sendEmail');

// Helper: generate JWT and set HTTP-only cookie
const signTokenAndSetCookie = (user, sessionId, res) => {
  const token = jwt.sign(
    { userId: user._id, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
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
    }).select('_id').lean();

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

    // Fetch user registrations (lean: plain objects, faster)
    const registrations = await Registration.find({ email: email.toLowerCase() }).select('-__v').lean();

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

    // Find user — select password explicitly (select:false by default) + only needed fields
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password name email access activeSessionId');
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

    // Fetch their registrations (lean: plain objects, no Mongoose overhead)
    const registrations = await Registration.find({ email: user.email.toLowerCase() }).select('-__v').lean();

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
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
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
    // lean() returns a plain JS object: 2-5x faster than a full Mongoose document
    const registrations = await Registration.find({ email: req.user.email.toLowerCase() }).select('-__v').lean();

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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 */
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    const sessionId = crypto.randomUUID();
    
    if (!user) {
      const confirmedReg = await Registration.findOne({
        email: email.toLowerCase(),
        status: 'confirmed',
      }).select('_id').lean();
      
      user = new User({
        name,
        email,
        googleId,
        activeSessionId: sessionId,
        access: !!confirmedReg,
      });
      await user.save();
    } else {
      user.activeSessionId = sessionId;
      if (!user.googleId) {
         user.googleId = googleId;
      }
      await user.save({ validateBeforeSave: false });
    }
    
    signTokenAndSetCookie(user, sessionId, res);
    const registrations = await Registration.find({ email: user.email.toLowerCase() }).select('-__v').lean();

    res.json({
      success: true,
      message: 'Google login successful.',
      user: { id: user._id, name: user.name, email: user.email, access: user.access, registrations },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
};

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'There is no user with that email.' });
    
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save({ validateBeforeSave: false });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you requested a password reset.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}`;
    
    try {
      await sendEmail({ email: user.email, subject: 'Password Reset Token', html: `<p>${message.replace(/\n/g, '<br/>')}</p>` });
      res.json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error('Email sending error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    
    if (req.body.password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully. You can now log in with the new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
