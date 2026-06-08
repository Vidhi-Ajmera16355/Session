import React, { useRef, useState, useEffect } from "react";

/* ── Extract YouTube video ID from any URL ── */
const extractVideoId = (urlOrId = "") => {
  if (!urlOrId) return "";
  try {
    const url = new URL(urlOrId);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  } catch {
    return urlOrId;
  }
  return urlOrId;
};

/* ── Read env variable (Vite / CRA / Next.js) ── */
const getEnvVideoUrl = () => {
  try {
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_SESSION_VIDEO_URL
    )
      return import.meta.env.VITE_SESSION_VIDEO_URL;
  } catch {}
  try {
    if (process.env?.REACT_APP_SESSION_VIDEO_URL)
      return process.env.REACT_APP_SESSION_VIDEO_URL;
    if (process.env?.NEXT_PUBLIC_SESSION_VIDEO_URL)
      return process.env.NEXT_PUBLIC_SESSION_VIDEO_URL;
  } catch {}
  return "";
};

/* ── Icon components ── */
const IconPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IconPause = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const IconVolume = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
  </svg>
);
const IconMute = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);
const IconCC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" />
  </svg>
);
const IconExpand = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);
const IconCompress = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

/* ── Control button ── */
const CtrlBtn = ({ onClick, title, active, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(255,255,255,0.1)" : "transparent",
        border: "none",
        color: active ? "#e63946" : hov ? "#fff" : "rgba(255,255,255,0.75)",
        cursor: "pointer",
        padding: "6px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.15s, background 0.15s",
        flexShrink: 0,
        minWidth: "32px",
        minHeight: "32px",
      }}
    >
      {children}
    </button>
  );
};

/* ══════════════════════════════════════════════════════════════
   YouTubePlayer
══════════════════════════════════════════════════════════════ */
const YouTubePlayer = ({
  embedUrl,
  videoUrl,
  studentName,
  studentEmail,
  purchaseId,
}) => {
  const actualUrl = embedUrl || videoUrl || getEnvVideoUrl();
  const videoId = extractVideoId(actualUrl);

  // ── refs ──────────────────────────────────────────────────
  const playerDivRef = useRef(null); // <div> YT replaces with <iframe>
  const ytPlayer = useRef(null); // actual YT player instance
  const wrapRef = useRef(null);
  const tickRef = useRef(null);
  const wmRef = useRef(null);
  const videoIdRef = useRef(videoId); // stable ref so callbacks see current value
  videoIdRef.current = videoId;

  // ── state ─────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [ccOn, setCcOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState("0:00 / 0:00");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wmPos, setWmPos] = useState({ top: "35%", left: "10%" });
  const [flash, setFlash] = useState(null);

  const WM_POS = [
    { top: "8%", left: "8%" },
    { top: "8%", left: "60%" },
    { top: "55%", left: "8%" },
    { top: "55%", left: "60%" },
  ];
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const fmt = (s) => {
    s = Math.floor(s || 0);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  // ── Bootstrap YT IFrame API ────────────────────────────────
  useEffect(() => {
    if (!videoId) return;

    // Called once the YT API script is ready AND our div is mounted
    const buildPlayer = () => {
      if (!playerDivRef.current) return;

      // Destroy any previous instance
      if (ytPlayer.current && typeof ytPlayer.current.destroy === "function") {
        try {
          ytPlayer.current.destroy();
        } catch {}
        ytPlayer.current = null;
      }

      // Create a fresh placeholder div (YT replaces the element it receives)
      // We keep playerDivRef pointing at the wrapper; YT will inject the iframe inside it.
      const instance = new window.YT.Player(playerDivRef.current, {
        height: "100%",
        width: "100%",
        videoId: videoIdRef.current,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          fs: 0,
          cc_load_policy: 0,
          playsinline: 1,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady(e) {
            // ✅ Store the INSTANCE returned via the event, not the config object
            ytPlayer.current = e.target;
            ytPlayer.current.setVolume(80);

            // Shift iframe up to hide YT's top title bar; bottom black div hides controls
            const iframe = playerDivRef.current?.querySelector("iframe");
            if (iframe) {
              iframe.style.cssText =
                "position:absolute;top:-36px;left:0;" +
                "width:100%;height:calc(100% + 96px);" +
                "border:none;pointer-events:none;";
            }

            // Progress tracker
            clearInterval(tickRef.current);
            tickRef.current = setInterval(() => {
              const p = ytPlayer.current;
              if (!p || typeof p.getCurrentTime !== "function") return;
              const cur = p.getCurrentTime() || 0;
              const dur = p.getDuration() || 0;
              setProgress(dur > 0 ? (cur / dur) * 100 : 0);
              setTimeDisplay(`${fmt(cur)} / ${fmt(dur)}`);
            }, 500);

            // Watermark mover
            clearInterval(wmRef.current);
            wmRef.current = setInterval(() => {
              setWmPos(WM_POS[Math.floor(Math.random() * WM_POS.length)]);
            }, 20000);
          },
          onStateChange(e) {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });

      // NOTE: do NOT do ytPlayer.current = instance here.
      // YT SDK fires onReady with e.target = the real proxy; use that instead.
    };

    if (window.YT?.Player) {
      buildPlayer();
    } else {
      if (!document.getElementById("yt-api-script")) {
        const s = document.createElement("script");
        s.id = "yt-api-script";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
      // Chain onto any existing callback (safe for multiple players)
      const prev = window.onYouTubeIframeAPIReady || null;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === "function") prev();
        buildPlayer();
      };
    }

    return () => {
      clearInterval(tickRef.current);
      clearInterval(wmRef.current);
      if (ytPlayer.current && typeof ytPlayer.current.destroy === "function") {
        try {
          ytPlayer.current.destroy();
        } catch {}
        ytPlayer.current = null;
      }
    };
  }, [videoId]);

  // ── Fullscreen listener ────────────────────────────────────
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Block devtools / screenshot keys ──────────────────────
  useEffect(() => {
    const block = (e) => {
      if (
        e.key === "F12" ||
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key))
      )
        e.preventDefault();
    };
    document.addEventListener("keydown", block, true);
    return () => document.removeEventListener("keydown", block, true);
  }, []);

  // ── Helpers ───────────────────────────────────────────────
  const getPlayer = () => ytPlayer.current;

  const doFlash = (type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 600);
  };

  const togglePlay = () => {
    const p = getPlayer();
    if (!p || typeof p.playVideo !== "function") return;
    if (isPlaying) {
      p.pauseVideo();
      doFlash("pause");
    } else {
      p.playVideo();
      doFlash("play");
    }
  };

  const handleVolume = (val) => {
    const p = getPlayer();
    const v = Number(val);
    setVolume(v);
    setIsMuted(v === 0);
    if (p) {
      p.setVolume(v);
      if (v === 0) p.mute();
      else p.unMute();
    }
  };

  const toggleMute = () => {
    const p = getPlayer();
    if (!p) return;
    if (isMuted) {
      const restore = volume > 0 ? volume : 80;
      p.unMute();
      p.setVolume(restore);
      setIsMuted(false);
      setVolume(restore);
    } else {
      p.mute();
      setIsMuted(true);
      setVolume(0);
    }
  };

  const toggleCC = () => {
    const p = getPlayer();
    if (!p) return;
    if (!ccOn) {
      p.loadModule("captions");
      p.setOption("captions", "track", {});
    } else {
      p.unloadModule("captions");
    }
    setCcOn((v) => !v);
  };

  const changeSpeed = (s) => {
    const p = getPlayer();
    if (p) p.setPlaybackRate(s);
    setSpeed(s);
    setSpeedOpen(false);
  };

  const seekTo = (e) => {
    const p = getPlayer();
    if (!p || typeof p.getDuration !== "function") return;
    const rect = e.currentTarget.getBoundingClientRect();
    p.seekTo(p.getDuration() * ((e.clientX - rect.left) / rect.width), true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement)
      wrapRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  // ── Guard ─────────────────────────────────────────────────
  if (!videoId || !studentName || !studentEmail || !purchaseId) {
    const missing = !videoId
      ? "Video URL"
      : !studentName
        ? "studentName"
        : !studentEmail
          ? "studentEmail"
          : "purchaseId";
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          borderRadius: "12px",
          background: "#111",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.5)",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ opacity: 0.4 }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span style={{ fontSize: "13px" }}>{missing} is missing</span>
        </div>
      </div>
    );
  }

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div
      ref={wrapRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: isFullscreen ? 0 : "12px",
        overflow: "hidden",
        background: "#000",
        boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        userSelect: "none",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* ══ VIDEO AREA ══ */}
      <div
        style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}
      >
        {/* YT mounts its iframe inside this div */}
        <div
          ref={playerDivRef}
          style={{ position: "absolute", inset: 0, background: "#000" }}
        />

        {/* Black bar — hides YT title bar (36px matches YT's actual title bar height) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "36px",
            background: "#000",
            zIndex: 10,
          }}
        />

        {/* Black bar — hides YT native controls */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: "#000",
            zIndex: 10,
          }}
        />

        {/* Click trap — play/pause; prevents any YT overlay link clicks */}
        <div
          onClick={togglePlay}
          style={{
            position: "absolute",
            top: "36px",
            left: 0,
            right: 0,
            bottom: "60px",
            zIndex: 8,
            cursor: "pointer",
          }}
        />

        {/* Play/Pause flash */}
        {flash && (
          <div
            style={{
              position: "absolute",
              inset: "36px 0 60px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                animation: "ytFlash 0.6s forwards",
                background: "rgba(0,0,0,0.45)",
                borderRadius: "50%",
                padding: "16px",
              }}
            >
              {flash === "play" ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Moving watermark */}
        <div
          style={{
            position: "absolute",
            top: wmPos.top,
            left: wmPos.left,
            transition: "top 2.5s ease-in-out,left 2.5s ease-in-out",
            pointerEvents: "none",
            zIndex: 15,
            lineHeight: "1.6",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.95))",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {studentName}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.40)",
              fontSize: "11px",
              fontWeight: 500,
            }}
          >
            {studentEmail}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "10px",
              fontWeight: 400,
            }}
          >
            ID: {purchaseId}
          </div>
        </div>

        {/* Secondary watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "72px",
            right: "12px",
            color: "rgba(255,255,255,0.22)",
            fontSize: "11px",
            fontWeight: 600,
            pointerEvents: "none",
            zIndex: 15,
            filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.9))",
          }}
        >
          {studentEmail}
        </div>

        {/* Anti-screenshot pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 14,
            background:
              "repeating-linear-gradient(45deg,transparent,transparent 15px,rgba(255,255,255,0.008) 15px,rgba(255,255,255,0.008) 30px)",
          }}
        />
      </div>

      {/* ══ PROGRESS BAR ══ */}
      <div
        onClick={seekTo}
        style={{
          position: "relative",
          height: "4px",
          background: "rgba(255,255,255,0.15)",
          cursor: "pointer",
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg,#e63946,#ff6b6b)",
            borderRadius: "0 2px 2px 0",
            transition: "width 0.5s linear",
          }}
        />
      </div>

      {/* ══ CONTROLS ══ */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "#111118",
          padding: "6px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          zIndex: 20,
          position: "relative",
        }}
      >
        <CtrlBtn onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <IconPause /> : <IconPlay />}
        </CtrlBtn>

        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            margin: "0 2px",
          }}
        >
          {timeDisplay}
        </span>

        <div style={{ flex: 1 }} />

        {/* Volume */}
        <CtrlBtn onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted || volume === 0 ? <IconMute /> : <IconVolume />}
        </CtrlBtn>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolume(e.target.value)}
          style={{
            WebkitAppearance: "none",
            width: "72px",
            height: "4px",
            borderRadius: "2px",
            outline: "none",
            cursor: "pointer",
            background: `linear-gradient(to right,#fff ${volume}%,rgba(255,255,255,0.2) ${volume}%)`,
          }}
        />

        {/* Captions */}
        <CtrlBtn onClick={toggleCC} title="Captions" active={ccOn}>
          <IconCC />
        </CtrlBtn>

        {/* Speed */}
        <div style={{ position: "relative" }}>
          <CtrlBtn
            onClick={(e) => {
              e.stopPropagation();
              setSpeedOpen((v) => !v);
            }}
            title="Playback speed"
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              {speed}×
            </span>
          </CtrlBtn>
          {speedOpen && (
            <>
              <div
                onClick={() => setSpeedOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 28 }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "42px",
                  right: 0,
                  background: "#1a1a28",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "90px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
                  zIndex: 29,
                }}
              >
                {SPEEDS.map((s) => (
                  <div
                    key={s}
                    onClick={(e) => {
                      e.stopPropagation();
                      changeSpeed(s);
                    }}
                    style={{
                      padding: "8px 16px",
                      color: s === speed ? "#e63946" : "rgba(255,255,255,0.75)",
                      fontWeight: s === speed ? 700 : 400,
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlign: "center",
                      background:
                        s === speed ? "rgba(230,57,70,0.08)" : "transparent",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        s === speed ? "rgba(230,57,70,0.08)" : "transparent")
                    }
                  >
                    {s}×
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fullscreen */}
        <CtrlBtn
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <IconCompress /> : <IconExpand />}
        </CtrlBtn>
      </div>

      <style>{`
        @keyframes ytFlash {
          0%   { opacity:1; transform:scale(1);    }
          100% { opacity:0; transform:scale(1.35); }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance:none;
          width:12px; height:12px;
          border-radius:50%; background:#fff; cursor:pointer;
        }
        input[type=range]::-moz-range-thumb {
          width:12px; height:12px; border:none;
          border-radius:50%; background:#fff; cursor:pointer;
        }
      `}</style>
    </div>
  );
};

export default YouTubePlayer;
