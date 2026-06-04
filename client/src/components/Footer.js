import React from 'react';

export default function Footer() {
  const s = {
    footer: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-muted)',
      padding: '48px 0',
      textAlign: 'center',
      fontSize: 13,
      borderTop: '1px solid var(--border)',
      transition: 'background 0.3s, border-color 0.3s',
    },
    inner: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    },
    name: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: 4,
    },
    badges: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 8,
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      padding: '4px 10px',
      borderRadius: 12,
      color: 'var(--text-secondary)',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
    },
  };

  return (
    <footer style={s.footer}>
      <div className="container">
        <div style={s.inner}>
          <div style={s.name}>Internship Playbook</div>
          <div>BTech CS/AIML 2022–2026 · IISER Bhopal → Goldman Sachs → Guidewire</div>
          <div style={s.badges}>
            {[
              ['var(--accent)', 'IISER Bhopal'],
              ['#3b82f6', 'Meridian Solutions'],
              ['var(--accent-orange)', 'Goldman Sachs'],
              ['var(--primary)', 'Hestabit Technologies'],
              ['#ec4899', 'Guidewire']
            ].map(([c, n]) => (
              <div key={n} style={s.badge}>
                <div style={{ ...s.dot, background: c }} />
                <span>{n}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>
            Only serious learners · Workshop closes 29 June · 1-on-1 closes 25 June 2026
          </div>
        </div>
      </div>
    </footer>
  );
}
