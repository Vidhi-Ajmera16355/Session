import React from 'react';

export default function Hero({ onCTA }) {
  const s = {
    hero: {
      padding: '120px 0 80px',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at top right, var(--primary-light), transparent 60%), var(--bg-primary)',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.3s, border-color 0.3s',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--accent-light)',
      border: '1px solid var(--accent)',
      color: 'var(--accent)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.5px',
      padding: '6px 14px',
      borderRadius: 20,
      marginBottom: 24,
      textTransform: 'uppercase',
    },
    h1: {
      fontSize: 'clamp(36px, 7vw, 60px)',
      fontWeight: 800,
      lineHeight: 1.1,
      color: 'var(--text-primary)',
      marginBottom: 24,
      maxWidth: 800,
      letterSpacing: '-1px',
    },
    accent: {
      color: 'var(--primary)',
      background: 'linear-gradient(to right, var(--primary), var(--accent))',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    sub: {
      fontSize: 18,
      color: 'var(--text-secondary)',
      maxWidth: 600,
      lineHeight: 1.7,
      marginBottom: 40,
      fontWeight: 400,
    },
    btnRow: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: 48,
    },
    btnPrimary: {
      background: 'var(--primary)',
      color: '#ffffff',
      padding: '14px 32px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 15,
      fontWeight: 700,
      boxShadow: 'var(--shadow-md)',
    },
    btnSecondary: {
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      padding: '13px 28px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 15,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    },
    deadline: {
      display: 'flex',
      gap: 32,
      flexWrap: 'wrap',
      borderTop: '1px solid var(--border)',
      paddingTop: 32,
    },
    dlItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    },
    dlLabel: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
      fontWeight: 600,
    },
    dlDate: {
      fontSize: 15,
      color: 'var(--text-primary)',
      fontWeight: 700,
    },
    divider: {
      width: 1,
      background: 'var(--border)',
      height: 36,
      alignSelf: 'center',
    },
  };

  return (
    <section style={s.hero}>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="fade-up" style={s.badge}>
          <span>🎯</span> Practical Guidance for Juniors
        </div>
        <h1 className="fade-up-2" style={s.h1}>
          Your Roadmap to <span style={s.accent}>Tech Opportunities</span>
          <br />— Starting from Scratch
        </h1>
        <p className="fade-up-3" style={s.sub}>
          I started seriously in my second year. If I can build a strong profile and secure good opportunities, you can too. Let's focus on practical steps, avoiding common mistakes, and finding your direction—because starting today matters more than when you started.
        </p>
        <div className="fade-up-4" style={s.btnRow}>
          <button 
            style={s.btnPrimary} 
            onClick={() => onCTA('workshop')}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
          >
            Join the Session — ₹59 →
          </button>
          <button 
            style={s.btnSecondary} 
            onClick={() => onCTA('oneonone')}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          >
            Book 1-on-1 Call — ₹159
          </button>
        </div>
        <div style={s.deadline} className="fade-up-4">
          <div style={s.dlItem}>
            <span style={s.dlLabel}>Workshop Registration</span>
            <span style={s.dlDate}>Closes 25 June 2026</span>
          </div>
          <div style={s.divider} />
          <div style={s.dlItem}>
            <span style={s.dlLabel}>1-on-1 Call Booking</span>
            <span style={s.dlDate}>Closes 29 June 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}
