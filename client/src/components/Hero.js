import React from 'react';

export default function Hero({ onCTA }) {
  const s = {
    hero: {
      padding: '30px 0 60px',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at top right, var(--primary-light), transparent 60%), var(--bg-primary)',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.3s, border-color 0.3s',
      position: 'relative',
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
      <div className="blob" style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, background: 'var(--primary)', opacity: 0.2, filter: 'blur(80px)', borderRadius: '50%' }} />
      <div className="blob" style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, background: 'var(--accent-orange)', opacity: 0.15, filter: 'blur(80px)', borderRadius: '50%' }} />

      <div className="container" style={{ ...s.container, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px', flexWrap: 'wrap-reverse' }}>
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={s.badge} className="fade-up glow-hover">
            <span>🎯</span> Practical Guidance for Juniors
          </div>
          <h1 style={{ ...s.h1, textAlign: 'left', margin: '0 0 24px' }} className="fade-up-2">
            Your Roadmap to <span className="text-gradient">Tech Opportunities</span>
            <br />— Starting from Scratch
          </h1>
          <p className="fade-up-3" style={{ ...s.sub, textAlign: 'left', margin: '0 0 40px' }}>
            I started seriously in my second year. If I can build a strong profile and secure good opportunities, you can too. Let's focus on practical steps, avoiding common mistakes, and finding your direction—because starting today matters more than when you started.
          </p>
          <div className="fade-up-4" style={{ ...s.btnRow, justifyContent: 'flex-start' }}>
            <button 
              style={{ ...s.btnPrimary, position: 'relative', overflow: 'hidden' }} 
              className="glow-hover"
              onClick={() => onCTA('workshop')}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >
              <div style={{position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 2.5s infinite'}}></div>
              Join the Session — ₹59 →
            </button>
            <button 
              style={s.btnSecondary} 
              className="glow-hover"
              onClick={() => onCTA('oneonone')}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              Book 1-on-1 Call — ₹159
            </button>
          </div>
          <div style={{ ...s.deadline, justifyContent: 'flex-start' }} className="fade-up-4">
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
        
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }} className="fade-up-3">
          <img 
            src="/girl_laptop_avatar_1780570517777.png" 
            alt="Avatar" 
            className="glow-hover"
            style={{ width: '100%', maxWidth: '380px', height: 'auto', borderRadius: '50%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '4px solid var(--border)' }}
          />
        </div>
      </div>
    </section>
  );
}
