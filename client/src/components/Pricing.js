import React from 'react';
import ScrollAnimation from './ScrollAnimation';
import { useAuth } from '../context/AuthContext';

export default function Pricing({ onSelect }) {
  const { user } = useAuth();

  const hasWorkshop = user?.registrations?.some(r => r.plan === 'workshop');
  const hasOneOnOne = user?.registrations?.some(r => r.plan === 'oneonone');

  const s = {
    section: {
      padding: '80px 0',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      transition: 'background 0.3s, border-color 0.3s',
      position: 'relative',
      overflow: 'hidden',
    },
    heading: {
      fontSize: 'clamp(32px, 5vw, 48px)',
      fontWeight: 800,
      marginBottom: 16,
      textAlign: 'center',
    },
    sub: {
      color: 'var(--text-secondary)',
      fontSize: 15,
      marginBottom: 48,
      textAlign: 'center',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: 32,
      maxWidth: 800,
      margin: '0 auto',
    },
    card: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '40px 32px',
      position: 'relative',
      boxShadow: 'var(--shadow-md)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
    },
    cardFeatured: {
      borderColor: 'var(--primary)',
      boxShadow: 'var(--shadow-lg)',
    },
    featuredBadge: {
      position: 'absolute',
      top: -14,
      left: 28,
      background: 'var(--primary)',
      color: '#ffffff',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.6px',
      padding: '4px 14px',
      borderRadius: 20,
      textTransform: 'uppercase',
      boxShadow: 'var(--shadow-sm)',
    },
    planLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: 'var(--text-muted)',
      marginBottom: 16,
      fontWeight: 700,
    },
    priceRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 8,
    },
    price: {
      fontSize: 48,
      fontWeight: 800,
      color: 'var(--text-primary)',
      letterSpacing: '-1px',
    },
    priceNote: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginBottom: 20,
    },
    desc: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      lineHeight: 1.6,
      marginBottom: 24,
      minHeight: 48,
    },
    perks: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: 32,
      flexGrow: 1,
    },
    perk: {
      display: 'flex',
      gap: 10,
      fontSize: 14,
      color: 'var(--text-secondary)',
      alignItems: 'flex-start',
    },
    check: {
      color: 'var(--accent)',
      fontWeight: 700,
      flexShrink: 0,
    },
    btn: {
      width: '100%',
      padding: '14px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 15,
      fontWeight: 700,
    },
    btnPrimary: {
      background: 'var(--primary)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-sm)',
    },
    btnOutline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
  };

  return (
    <section id="pricing" style={s.section}>
      <div className="blob" style={{ top: '20%', left: '10%', width: 300, height: 300, background: 'var(--primary)' }} />
      <div className="blob" style={{ bottom: '20%', right: '10%', width: 400, height: 400, background: 'var(--accent)' }} />
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={s.heading} className="text-gradient">
          Ready to Level Up? <ScrollAnimation animationClass="burst-diamond">💎</ScrollAnimation>
        </h2>
        <p style={s.sub}>Choose the plan that fits your current goals.</p>
        <div style={s.grid}>
          {/* Workshop */}
          <div 
            style={{ ...s.card, transform: 'scale(1.05)', zIndex: 2 }}
            className="fade-up-2 gradient-border glow-hover"
          >
            <span style={s.featuredBadge}>Most Popular</span>
            <div style={{ ...s.planLabel, ...(hasWorkshop ? { textDecoration: 'underline', color: 'var(--primary)' } : {}) }}>
              Group Workshop {hasWorkshop && '✓ (Purchased)'}
            </div>
            <div style={s.priceRow}>
              <span className="strikethrough">₹99</span><span style={s.price}>₹59</span>
            </div>
            <div style={s.priceNote}>Lifetime Access (Recorded Session) · <span style={{ color: 'var(--accent)', fontWeight: 700, animation: 'pulse 2s infinite' }}>Only till 29 June</span></div>
            <div style={s.desc}>Completely confused about where to start? This session breaks down the roadmap to secure your first opportunity.</div>
            <ul style={s.perks}>
              {['My personal journey (started in 2nd year)', 'Roadmap to your first internship/job', 'Building a strong profile over time', 'Suitable even if you feel you have done nothing', 'Watch anytime at your own pace'].map((p, i) => (
                <li key={i} style={s.perk}><span style={s.check}>✓</span>{p}</li>
              ))}
            </ul>
            {hasWorkshop ? (
              <button style={{ ...s.btn, background: 'var(--accent)', color: '#fff', cursor: 'default' }}>
                ✓ Already Purchased
              </button>
            ) : (
              <button 
                style={{ ...s.btn, ...s.btnPrimary, position: 'relative', overflow: 'hidden' }} 
                onClick={() => onSelect('workshop')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
              >
                <div style={{position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 2s infinite'}}></div>
                Register for ₹59 →
              </button>
            )}
          </div>

          {/* 1-on-1 */}
          <div 
            style={s.card} 
            className="fade-up-2 glow-hover"
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ ...s.planLabel, ...(hasOneOnOne ? { textDecoration: 'underline', color: 'var(--primary)' } : {}) }}>
              1-on-1 Call {hasOneOnOne && '✓ (Purchased)'}
            </div>
            <div style={s.priceRow}>
              <span style={s.price}>₹159</span>
            </div>
            <div style={s.priceNote}><span style={{ color: 'var(--accent)', fontWeight: 700 }}>Only till 25 June</span> · Limited to first 50 seats</div>
            <div style={s.desc}>Direct access to avoid common mistakes. Prices are kept minimal for serious individuals building their career. Keep your notes handy!</div>
            <ul style={s.perks}>
              {['Personalized to your current situation', 'Detailed schedule & timing shared via Gmail', 'Session details available on the website', 'Choice of Google Meet or WhatsApp Call', 'Action-oriented and practical discussion'].map((p, i) => (
                <li key={i} style={s.perk}><span style={{ ...s.check, color: 'var(--primary)' }}>✓</span>{p}</li>
              ))}
            </ul>
            {hasOneOnOne ? (
              <button style={{ ...s.btn, background: 'var(--accent)', color: '#fff', cursor: 'default', border: 'none' }}>
                ✓ Already Purchased
              </button>
            ) : (
              <button 
                style={{ ...s.btn, ...s.btnOutline }} 
                onClick={() => onSelect('oneonone')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Book 1-on-1 for ₹159 →
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
