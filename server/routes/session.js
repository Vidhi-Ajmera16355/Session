const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requirePaidAccess = require('../middleware/requirePaidAccess');
const sessionController = require('../controllers/sessionController');

// validates the short-lived JWT passed as the `token` query parameter.
router.get(
  '/video/stream',
  sessionController.streamSessionVideo
);

// GET /api/session/video
// ─────────────────────────────────────────────────────────────────────────────
// Returns a signed stream URL. User must be logged in and have paid access.
router.get(
  '/video',
  requireAuth,
  requirePaidAccess,
  sessionController.getSessionVideo
);

// GET /api/session/resources
// ─────────────────────────────────────────────────────────────────────────────
// Sends the bonus PDF. User must be logged in and have paid access.
router.get(
  '/resources',
  requireAuth,
  requirePaidAccess,
  sessionController.getSessionResources
);

module.exports = router;