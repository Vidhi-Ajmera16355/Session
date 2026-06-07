import React from 'react';

const WatermarkInfoSection = () => {
  return (
    <section style={{ padding: '80px 24px', background: 'var(--bg-primary)' }}>
      <div className="container">
        <div className="glass gradient-border" style={{ padding: '40px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>🛡️</div>
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Protected Learning Experience</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Our platform utilizes advanced proprietary video technology to ensure a secure, uninterrupted, and premium learning experience for all enrolled students.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'left' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>Dynamic Watermark Tech</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Intelligent adaptive watermark that adjusts to video brightness for optimal viewing without being intrusive.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>Personalized ID</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Your session is tied to your unique identity to protect your investment.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>Anti-Piracy Protection</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Deterrence mechanisms to stop unauthorized screen recordings and screenshots.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>Secure Streaming</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Encrypted video delivery ensures smooth, high-quality playback on any device.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WatermarkInfoSection;
