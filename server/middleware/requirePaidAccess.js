/**
 * Middleware: requirePaidAccess
 *
 * Must be used AFTER requireAuth (depends on req.user).
 * Checks if the user has paid for session access (access === true).
 */
const Registration = require('../models/Registration');

const requirePaidAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  const confirmedReg = await Registration.findOne({ 
    email: req.user.email.toLowerCase(), 
    status: 'confirmed' 
  });

  if (req.user.access !== true && !confirmedReg) {
    return res.status(403).json({
      success: false,
      message: 'Please purchase the session to access this content or wait for verification.',
    });
  }

  next();
};

module.exports = requirePaidAccess;
