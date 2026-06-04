import React from 'react';
import ScrollAnimation from './ScrollAnimation';

const stops = [
  { org: 'IISER Bhopal', role: 'Research Intern', note: 'Unpaid — but cracking it was everything', color: 'var(--accent)', dot: 'var(--accent)' },
  { org: 'Meridian Solutions', role: 'On-campus Intern', note: '1 of 15 selected from entire campus', color: '#3b82f6', dot: '#60a5fa' },
  { org: 'Goldman Sachs', role: 'Summer Intern (19.5 LPA)', note: 'Read the offer as 1.95 LPA — it was 19.5 LPA', color: 'var(--accent-orange)', dot: 'var(--accent-orange)' },
  { org: 'Hestabit Technologies', role: 'Full-time Engineer', note: '1 of 9 selected · Got the real taste of corporate coding', color: 'var(--primary)', dot: 'var(--primary)' },
  { org: 'Guidewire', role: 'Current Intern', note: 'Left FTE for better learning — zero regrets', color: '#ec4899', dot: '#f472b6' },
];

export default function Journey() {
  const s = {
    section: {
      padding: '80px 0',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      transition: 'background 0.3s, border-color 0.3s',
    },
    label: {
      fontSize: 11,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 32,
      fontWeight: 600,
    },
    grid: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      maxWidth: 600,
    },
    stop: {
      display: 'flex',
      gap: 24,
      paddingBottom: 32,
      position: 'relative',
    },
    lineWrap: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flexShrink: 0,
      width: 24,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: '50%',
      flexShrink: 0,
      marginTop: 6,
      boxShadow: '0 0 0 4px var(--bg-primary), 0 0 0 6px var(--border)',
      transition: 'all 0.3s ease',
      animation: 'pulse 2s infinite',
    },
    line: {
      width: 2,
      flex: 1,
      background: 'linear-gradient(to bottom, var(--border), var(--primary-light))',
      marginTop: 10,
    },
    contentCard: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 24px',
      boxShadow: 'var(--shadow-sm)',
      width: '100%',
      transition: 'all 0.2s ease',
    },
    org: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 4,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    role: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      fontWeight: 600,
      marginBottom: 8,
    },
    note: {
      fontSize: 13,
      fontStyle: 'italic',
      color: 'var(--text-muted)',
      lineHeight: 1.5,
    },
  };

  return (
    <section style={s.section}>
      <div className="container">
        <div style={s.label}>
          The Journey <ScrollAnimation animationClass="slide-target">🎯</ScrollAnimation>
        </div>
        <div style={s.grid}>
          {stops.map((stop, i) => (
            <div key={i} style={s.stop} className="fade-up">
              <div style={s.lineWrap}>
                <div style={{ ...s.dot, background: stop.dot }} />
                {i < stops.length - 1 && <div style={s.line} />}
              </div>
              <div 
                style={s.contentCard} 
                className="glow-hover"
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = stop.dot;
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ ...s.org, color: stop.color }}>{stop.org}</div>
                <div style={s.role}>{stop.role}</div>
                <div style={s.note}>"{stop.note}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
