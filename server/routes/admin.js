const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to authenticate admin requests using X-Admin-Token header
const authAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!process.env.ADMIN_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Admin access is not configured on the server.',
    });
  }
  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid admin secret.',
    });
  }
  next();
};

// GET /api/admin/users — list all registered users (auth system)
router.get('/users', authAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/admin/users/:id/access — toggle access for a user
router.patch('/users/:id/access', authAdmin, async (req, res) => {
  try {
    const { access } = req.body;

    if (typeof access !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Access must be a boolean value (true or false).',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { access },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Admin toggle access error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
