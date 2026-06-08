import React, { useRef, useState, useEffect } from "react";

const YouTubePlayer = ({ embedUrl, studentName, studentEmail, purchaseId }) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [wmPos, setWmPos] = useState({ top: "35%", left: "10%" });
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Randomize watermark position every 20 seconds ──
  useEffect(() => {
    const move = () => {
      const positions = [
        { top: "8%", left: "8%" },
        { top: "8%", left: "65%" },
        { top: "72%", left: "8%" },
        { top: "55%", left: "65%" },
      ];
      const pick = positions[Math.floor(Math.random() * positions.length)];
      setWmPos(pick);
    };
    const interval = setInterval(move, 20000);
    return () => clearInterval(interval);
  }, []);

  // ── Aggressive event blocking ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const blockEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const blockCopy = (e) => {
      e.preventDefault();
      e.clipboardData.setData("text/plain", "Access denied");
    };

    const blockKeyboard = (e) => {
      // Block developer tools and screenshot shortcuts
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && e.key === "J")
      ) {
        e.preventDefault();
        console.warn("Access attempt detected and blocked");
      }
    };

    // Right-click blocker
    el.addEventListener("contextmenu", blockEvent, true);
    // Copy/paste blocker
    el.addEventListener("copy", blockCopy, true);
    el.addEventListener("cut", blockEvent, true);
    // Keyboard shortcuts blocker
    document.addEventListener("keydown", blockKeyboard, true);
    // Prevent drag
    el.addEventListener("drag", blockEvent, true);
    el.addEventListener("dragstart", blockEvent, true);

    return () => {
      el.removeEventListener("contextmenu", blockEvent, true);
      el.removeEventListener("copy", blockCopy, true);
      el.removeEventListener("cut", blockEvent, true);
      document.removeEventListener("keydown", blockKeyboard, true);
      el.removeEventListener("drag", blockEvent, true);
      el.removeEventListener("dragstart", blockEvent, true);
    };
  }, []);

  // ── Dynamically inject iframe after a delay to hide from initial DOM inspection ──
  useEffect(() => {
    if (!iframeRef.current || !embedUrl) return;

    const injectIframe = () => {
      try {
        const u = new URL(embedUrl);
        u.searchParams.set("modestbranding", "1");
        u.searchParams.set("rel", "0");
        u.searchParams.set("iv_load_policy", "3");
        u.searchParams.set("fs", "0"); // Disable fullscreen to hide "Watch on YouTube" link
        u.searchParams.set("disablekb", "0"); // Keep keyboard controls but limit UI
        const finalUrl = u.toString();

        const iframe = document.createElement("iframe");
        iframe.src = finalUrl;
        iframe.title = "Secure Course Video";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        `;
        iframe.onload = () => setIsLoaded(true);

        // Clear previous iframe
        iframeRef.current.innerHTML = "";
        iframeRef.current.appendChild(iframe);

        // Log access (for server-side auditing)
        if (window.__logVideoAccess) {
          window.__logVideoAccess({
            user: studentEmail,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("[player] Error injecting iframe:", err);
      }
    };

    // Inject after 500ms to hide from initial page inspection
    const timer = setTimeout(injectIframe, 500);
    return () => clearTimeout(timer);
  }, [embedUrl, studentEmail]);

  // ── Monitor for DOM manipulation attempts ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "style") {
          // Revert any style changes to blockers
          if (m.target.dataset.blocker) {
            m.target.style.zIndex = "20";
            m.target.style.pointerEvents = "all";
            m.target.style.display = "block";
          }
        }
      });
    });

    observer.observe(el, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "data-blocker"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "#000",
        boxShadow: "var(--shadow-lg)",
        userSelect: "none",
      }}
    >
      {/* Loading state */}
      {!isLoaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#0d0d1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.25)",
            fontSize: "14px",
            zIndex: 25,
          }}
        >
          Loading video...
        </div>
      )}

      {/* Iframe container — dynamically populated by useEffect */}
      <div
        ref={iframeRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* TOP BAR BLOCKER — covers video title, channel name, YT logo */}
      <div
        data-blocker="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "20%",
          zIndex: 20,
          pointerEvents: "all",
          cursor: "default",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
        }}
      />

      {/* BOTTOM BAR FULL BLOCKER — covers all controls, logo, and "Watch on YouTube" */}
      <div
        data-blocker="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "20%",
          zIndex: 20,
          pointerEvents: "all",
          cursor: "default",
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
        }}
      />

      {/* LEFT SIDE BLOCKER */}
      <div
        data-blocker="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "5%",
          zIndex: 20,
          pointerEvents: "all",
          cursor: "default",
          background: "transparent",
        }}
      />

      {/* RIGHT SIDE BLOCKER — fully covers right edge where YT logo sits */}
      <div
        data-blocker="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "8%",
          zIndex: 20,
          pointerEvents: "all",
          cursor: "default",
          background: "transparent",
        }}
      />

      {/* WATERMARK + FORENSIC OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 15,
        }}
      >
        {/* Primary moving watermark */}
        <div
          style={{
            position: "absolute",
            top: wmPos.top,
            left: wmPos.left,
            transition: "top 2.5s ease-in-out, left 2.5s ease-in-out",
            fontFamily: "Outfit, sans-serif",
            lineHeight: "1.5",
            userSelect: "none",
            WebkitUserSelect: "none",
            filter:
              "drop-shadow(0 2px 8px rgba(0,0,0,0.95)) drop-shadow(0 -1px 3px rgba(0,0,0,0.7))",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            {studentName}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            {studentEmail}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.30)",
              fontSize: "10px",
              fontWeight: "400",
            }}
          >
            ID: {purchaseId}
          </div>
        </div>

        {/* Secondary watermark in opposite corner */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "8%",
            fontFamily: "Outfit, sans-serif",
            color: "rgba(255,255,255,0.25)",
            fontSize: "11px",
            fontWeight: "600",
            filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.9))",
          }}
        >
          {studentEmail}
        </div>

        {/* Anti-screenshot diagonal pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.008) 15px, rgba(255,255,255,0.008) 30px)",
          }}
        />

        {/* Hologram-like shimmer effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.015) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 8s infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default YouTubePlayer;
