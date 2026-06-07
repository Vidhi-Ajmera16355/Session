import React, { useRef, useState, useEffect } from 'react';

const VideoPlayer = ({ src, studentName, studentEmail, purchaseId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [wmStyle, setWmStyle] = useState({ top: '10%', left: '10%', color: 'rgba(255,255,255,0.4)', textShadow: '0 0 2px rgba(0,0,0,0.8)' });
  const [isPlaying, setIsPlaying] = useState(false);

  // Randomize position every 30 seconds
  useEffect(() => {
    const moveInterval = setInterval(() => {
      const top = Math.floor(Math.random() * 70) + 10 + '%'; // 10% to 80%
      const left = Math.floor(Math.random() * 60) + 10 + '%'; // 10% to 70%
      setWmStyle(prev => ({ ...prev, top, left }));
    }, 30000);
    return () => clearInterval(moveInterval);
  }, []);

  // Analyze video frame brightness to adapt watermark contrast
  useEffect(() => {
    let animationFrameId;

    const analyzeFrame = () => {
      if (videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Match canvas to video dimensions
        if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        if (canvas.width > 0) {
          // Draw current frame to offscreen canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            // Get pixel data from the area where the watermark is currently located
            // For performance, we'll just check a small 100x100 sample near the watermark coordinates
            const topPx = (parseFloat(wmStyle.top) / 100) * canvas.height;
            const leftPx = (parseFloat(wmStyle.left) / 100) * canvas.width;
            
            // Ensure we don't go out of bounds
            const sampleX = Math.min(Math.max(0, leftPx), canvas.width - 100);
            const sampleY = Math.min(Math.max(0, topPx), canvas.height - 100);
            
            const frame = ctx.getImageData(sampleX, sampleY, 100, 100);
            const data = frame.data;
            let r=0, g=0, b=0;
            
            for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel for speed
              r += data[i];
              g += data[i+1];
              b += data[i+2];
            }
            const count = data.length / 16;
            r = Math.floor(r/count);
            g = Math.floor(g/count);
            b = Math.floor(b/count);
            
            // Calculate perceived brightness (luminance)
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            
            // If scene is bright, make watermark darker, else lighter.
            // Requirement: "slightly darker and more visible than typical transparent watermark... never completely disappear"
            if (brightness > 128) {
              setWmStyle(prev => ({
                ...prev,
                color: 'rgba(0, 0, 0, 0.45)', // darker watermark for bright background
                textShadow: '0 0 1px rgba(255,255,255,0.3)'
              }));
            } else {
              setWmStyle(prev => ({
                ...prev,
                color: 'rgba(255, 255, 255, 0.45)', // lighter watermark for dark background
                textShadow: '0 0 2px rgba(0,0,0,0.8)'
              }));
            }
          } catch(e) {
            // CORS can prevent getImageData if video is hosted elsewhere without crossorigin="anonymous"
          }
        }
      }
      
      // Throttle checking to ~4 times a second instead of 60fps for performance
      setTimeout(() => {
        animationFrameId = requestAnimationFrame(analyzeFrame);
      }, 250);
    };

    if (isPlaying) {
      analyzeFrame();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, wmStyle.top, wmStyle.left]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', boxShadow: 'var(--shadow-lg)' }}>
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload"
        crossOrigin="anonymous" // Essential for getImageData from external URLs
        style={{ width: '100%', display: 'block' }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        Your browser does not support HTML video.
      </video>

      {/* Dynamic Watermark Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: wmStyle.top,
          left: wmStyle.left,
          color: wmStyle.color,
          textShadow: wmStyle.textShadow,
          pointerEvents: 'none', // pass clicks through to video
          fontFamily: 'Outfit, sans-serif',
          fontSize: '14px',
          fontWeight: '600',
          lineHeight: '1.4',
          transition: 'color 0.5s, text-shadow 0.5s, top 2s ease-in-out, left 2s ease-in-out',
          zIndex: 10,
          opacity: 0.85
        }}
      >
        <div style={{ opacity: 0.9 }}>{studentName}</div>
        <div style={{ opacity: 0.7, fontSize: '12px' }}>{studentEmail}</div>
        <div style={{ opacity: 0.5, fontSize: '10px' }}>ID: {purchaseId}</div>
      </div>
      
      {/* Anti-screenshot deterrence subtle overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.01) 10px, rgba(255,255,255,0.01) 20px)',
        pointerEvents: 'none',
        zIndex: 5
      }}></div>
    </div>
  );
};

export default VideoPlayer;
