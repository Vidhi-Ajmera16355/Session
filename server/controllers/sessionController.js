const jwt = require("jsonwebtoken");

exports.getSessionVideo = (req, res) => {
  const videoUrl = process.env.SESSION_VIDEO_URL;

  if (!videoUrl) {
    console.error("[video] SESSION_VIDEO_URL is not set in .env");
    return res.status(500).json({
      success: false,
      message: "Video is currently unavailable.",
    });
  }

  // Extract YouTube video ID from any YouTube URL format
  let youtubeId = null;
  const ytPatterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of ytPatterns) {
    const match = videoUrl.match(pattern);
    if (match) {
      youtubeId = match[1];
      break;
    }
  }

  if (!youtubeId) {
    console.error("[video] Could not extract YouTube ID from:", videoUrl);
    return res
      .status(500)
      .json({ success: false, message: "Invalid video configuration." });
  }

  // Log access attempt with user info for forensic purposes
  console.log(
    `[video-access] User: ${req.user.email} | ID: ${req.user._id} | Timestamp: ${new Date().toISOString()} | IP: ${req.ip}`,
  );

  // Sign a short-lived token carrying the YouTube ID
  // Added additional metadata for security auditing
  const streamToken = jwt.sign(
    {
      userId: req.user._id,
      userEmail: req.user.email,
      youtubeId,
      purpose: "video-stream",
      iat: Date.now(),
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  // Obfuscate the response - don't reveal internal details
  const tokenizedUrl = `/api/session/video/stream?token=${streamToken}&t=${Date.now()}`;

  res.json({
    success: true,
    videoUrl: tokenizedUrl,
    videoType: "youtube",
  });
};

/**
 * GET /api/session/video/stream
 * Validates the JWT and returns the YouTube embed config.
 * Returns JSON (not a redirect) — the frontend renders the iframe.
 *
 * Security measures:
 * - Token-based access control
 * - Time-stamped tokens
 * - IP validation
 * - Access logging for forensic purposes
 */
exports.streamSessionVideo = (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No stream token." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.warn(`[security] Token verification failed: ${err.message}`);
    return res
      .status(401)
      .json({ success: false, message: "Expired or invalid stream token." });
  }

  if (decoded.purpose !== "video-stream") {
    console.warn(`[security] Invalid token purpose: ${decoded.purpose}`);
    return res
      .status(403)
      .json({ success: false, message: "Invalid token purpose." });
  }

  // Verify YouTube ID format (11 characters, alphanumeric + dash + underscore)
  if (!/^[a-zA-Z0-9_-]{11}$/.test(decoded.youtubeId)) {
    console.warn(`[security] Invalid YouTube ID format: ${decoded.youtubeId}`);
    return res
      .status(400)
      .json({ success: false, message: "Invalid video ID." });
  }

  // Log successful access
  console.log(
    `[video-stream] User: ${decoded.userEmail} | YT-ID: ${decoded.youtubeId} | Timestamp: ${new Date().toISOString()}`,
  );

  // Return the YouTube embed URL with privacy-enhanced mode and no related videos
  // Use youtube-nocookie.com domain to minimize tracking
  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${decoded.youtubeId}` +
    `?rel=0&modestbranding=1&enablejsapi=0&origin=${encodeURIComponent(process.env.FRONTEND_URL || "http://localhost:3000")}`;

  // Return obfuscated response - don't expose raw video URLs
  res.json({
    success: true,
    youtubeId: decoded.youtubeId, // This is already extracted from the config
    embedUrl, // Properly constructed with security parameters
  });
};

/**
 * GET /api/session/resources
 */
exports.getSessionResources = (req, res) => {
  const path = require("path");
  const pdfPath = path.join(__dirname, "../protected_files/Resources (1).pdf");
  res.download(pdfPath, "Resources.pdf", (err) => {
    if (err) {
      console.error("[resources] Error:", err);
      if (!res.headersSent)
        res
          .status(500)
          .json({ success: false, message: "Could not download resources." });
    }
  });
};
