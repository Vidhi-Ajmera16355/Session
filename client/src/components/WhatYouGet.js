import React from 'react';

const topics = [
  { n: '01', title: 'Getting your first internship', desc: 'How to secure your first role, even without prior experience, and build momentum.' },
  { n: '02', title: 'On-campus vs off-campus strategy', desc: 'Understanding the different approaches required for both paths.' },
  { n: '03', title: 'Practical Interview Preparation', desc: 'Focused preparation strategies beyond just practicing coding problems.' },
  { n: '04', title: 'Evaluating Opportunities', desc: 'How to weigh different offers and choose what aligns with your long-term goals.' },
  { n: '05', title: 'Building a Strong Profile', desc: 'How to present your skills authentically on your resume and LinkedIn.' },
  { n: '06', title: 'Navigating Career Decisions', desc: 'My thought process behind taking risks and making early career choices.' },
];

export default function WhatYouGet() {
  const s = {
    section: {
      padding: '80px 0',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      transition: 'background 0.3s, border-color 0.3s',
    },
    heading: {
      fontSize: 'clamp(24px, 4vw, 36px)',
      fontWeight: 800,
      marginBottom: 8,
    },
    sub: {
      color: 'var(--text-secondary)',
      fontSize: 15,
      marginBottom: 48,
      maxWidth: 540,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 24,
    },
    card: {
      padding: '32px 24px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: 'var(--shadow-sm)',
    },
    num: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--primary)',
      marginBottom: 16,
      letterSpacing: '1px',
    },
    title: {
      fontWeight: 700,
      fontSize: 18,
      marginBottom: 10,
      lineHeight: 1.3,
      color: 'var(--text-primary)',
    },
    desc: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      lineHeight: 1.6,
    },
  };

  return (
    <section style={s.section}>
      <div className="container">
        <h2 style={s.heading}>What the Session Covers</h2>
        <p style={s.sub}>Practical topics based on my real-world engineering experiences.</p>
        <div style={s.grid}>
          {topics.map((t, i) => (
            <div 
              key={i} 
              style={s.card}
              className="fade-up"
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={s.num}>{t.n}</div>
              <div style={s.title}>{t.title}</div>
              <div style={s.desc}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
