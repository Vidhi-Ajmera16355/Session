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
