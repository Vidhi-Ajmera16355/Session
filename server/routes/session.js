const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requirePaidAccess = require('../middleware/requirePaidAccess');
const sessionController = require('../controllers/sessionController');

// GET /api/session/video
// Middleware chain: requireAuth → requirePaidAccess → controller
router.get(
  '/video',
  requireAuth,
  requirePaidAccess,
  sessionController.getSessionVideo
);

module.exports = router;
