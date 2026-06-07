import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ScreenRecordGuard
 * 
 * Detects screen recording / screen capture attempts and shows
 * a full-page blocking overlay. Also renders a dynamic, moving
 * forensic watermark over the video area with email + name + timestamp.
 * 
 * Watermark features:
 *  - Multiple watermark bands that drift across the video
 *  - Live timestamp updated every second
 *  - Position shifts every 4 seconds randomly
 *  - Includes user email + name for traceability
 * 
 * Detection methods:
 *  1. Right-click & keyboard shortcut blocking (PrintScreen, Ctrl+Shift+S, etc.)
 *  2. Screen capture detection using experimental APIs
 *  3. Picture-in-Picture blocking
 */
export default function ScreenRecordGuard({ userEmail, userName, children }) {
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [wmPositions, setWmPositions] = useState([]);
  const dismissTimeout = useRef(null);

  const triggerBlock = useCallback((reason) => {
    setBlocked(true);
    setBlockReason(reason);
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
  }, []);

  const handleDismiss = useCallback(() => {
    setBlocked(false);
    setBlockReason('');
  }, []);

  // ── Live timestamp that updates every second ──
  useEffect(() => {
    const formatTimestamp = () => {
      const now = new Date();
      const date = now.toLocaleDateString('en-IN', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      });
      const time = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
      return `${date} ${time}`;
    };

    setTimestamp(formatTimestamp());
    const interval = setInterval(() => {
      setTimestamp(formatTimestamp());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ── Watermark position shift every 4 seconds ──
  useEffect(() => {
    const generatePositions = () => {
      // Generate random positions for each of the 6 watermark bands
      return Array.from({ length: 6 }, () => ({
        x: Math.round(Math.random() * 60 - 30),   // -30 to +30px
        y: Math.round(Math.random() * 40 - 20),   // -20 to +20px
        rotate: Math.round(Math.random() * 10 - 20), // -20 to -10deg
      }));
    };

    setWmPositions(generatePositions());
    const interval = setInterval(() => {
      setWmPositions(generatePositions());
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ── Detection effects ──
  useEffect(() => {
    // 1. Keyboard shortcut blocking
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerBlock('Screenshot attempt detected');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['s', 'S', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        triggerBlock('Screenshot shortcut detected');
        return;
      }
      if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) || e.key === 'F12') {
        e.preventDefault();
        triggerBlock('Developer tools are not allowed while viewing content');
        return;
      }
    };

    // 2. Right-click blocking
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 3. Screen capture detection using experimental APIs
    let screenCaptureCleanup = null;
    const detectScreenCapture = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
          const handler = () => {
            triggerBlock('Screen capture detected');
          };
          navigator.mediaDevices.addEventListener('devicechange', handler);
          screenCaptureCleanup = () => {
            navigator.mediaDevices.removeEventListener('devicechange', handler);
          };
        }
      } catch (err) {
        // Silently fail — best-effort
      }
    };
    detectScreenCapture();

    // 4. Picture-in-Picture blocking
    const handlePiP = () => {
      triggerBlock('Picture-in-Picture is not allowed for protected content');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('enterpictureinpicture', handlePiP);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('enterpictureinpicture', handlePiP);
      if (screenCaptureCleanup) screenCaptureCleanup();
      if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    };
  }, [triggerBlock]);

  // Build the watermark string: email + name + timestamp
  const emailStr = userEmail || '';
  const nameStr = userName || '';
  const watermarkLine = [nameStr, emailStr, timestamp].filter(Boolean).join('  •  ');

  return (
    <div className="screen-record-guard">
      {/* Blocking Overlay */}
      {blocked && (
        <div className="srg-overlay">
          <div className="srg-overlay-content">
            <div className="srg-shield-icon">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <path d="M40 8L12 20v20c0 16.6 11.9 32.1 28 36 16.1-3.9 28-19.4 28-36V20L40 8z" 
                      fill="url(#shieldGrad)" opacity="0.15" />
                <path d="M40 8L12 20v20c0 16.6 11.9 32.1 28 36 16.1-3.9 28-19.4 28-36V20L40 8z" 
                      stroke="url(#shieldGrad)" strokeWidth="2.5" fill="none" />
                <line x1="32" y1="32" x2="48" y2="48" stroke="#ef4444" strokeWidth="3.5" 
                      strokeLinecap="round" className="srg-x-line" />
                <line x1="48" y1="32" x2="32" y2="48" stroke="#ef4444" strokeWidth="3.5" 
                      strokeLinecap="round" className="srg-x-line" />
              </svg>
            </div>
            
            <h1 className="srg-title">Screen Recording Not Allowed</h1>
            <p className="srg-subtitle">{blockReason || 'Screen capture has been detected'}</p>
            
            <div className="srg-warning-box">
              <div className="srg-warning-icon">⚠️</div>
              <p>
                This content is protected and exclusively licensed to <strong>{userEmail}</strong>. 
                Any attempt to record, screenshot, or redistribute this content is a violation of our terms of service 
                and may result in permanent account suspension.
              </p>
            </div>

            <button className="srg-dismiss-btn" onClick={handleDismiss}>
              <span>I understand, continue watching</span>
            </button>

            <p className="srg-footer-note">
              If you believe this was triggered in error, please stop any screen recording software and try again.
            </p>
          </div>

          {/* Animated background particles */}
          <div className="srg-particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="srg-particle" style={{
                '--delay': `${i * 0.5}s`,
                '--x': `${20 + Math.random() * 60}%`,
                '--y': `${20 + Math.random() * 60}%`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Forensic Watermark Layer over children */}
      <div className="srg-content-wrapper">
        {children}
        <div className="srg-watermark-layer" aria-hidden="true">
          {wmPositions.map((pos, i) => (
            <div 
              key={i} 
              className="srg-watermark-band"
              style={{
                '--wm-row': i,
                transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotate}deg)`,
              }}
            >
              {/* Repeat watermark text 3 times per band for wide coverage */}
              {[0, 1, 2].map((j) => (
                <span key={j} className="srg-watermark-text">
                  {watermarkLine}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
