/**
 * GET /api/session/video
 * Protected by requireAuth + requirePaidAccess middleware.
 * Returns the video URL only to authenticated, paid users.
 */
exports.getSessionVideo = (req, res) => {
  const videoUrl = process.env.SESSION_VIDEO_URL;

  if (!videoUrl) {
    console.error('SESSION_VIDEO_URL is not configured in .env');
    return res.status(500).json({
      success: false,
      message: 'Video is currently unavailable. Please try again later.',
    });
  }

  res.json({
    success: true,
    videoUrl,
  });
};

/**
 * GET /api/session/resources
 * Protected by requireAuth + requirePaidAccess middleware.
 * Downloads the bonus learning resources PDF.
 */
exports.getSessionResources = (req, res) => {
  const path = require('path');
  const pdfPath = path.join(__dirname, '../protected_files/Resources (1).pdf');
  res.download(pdfPath, 'Resources.pdf', (err) => {
    if (err) {
      console.error('Error downloading PDF:', err);
      // If headers are already sent, do not attempt to send error JSON
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Could not download resources.' });
      }
    }
  });
};
