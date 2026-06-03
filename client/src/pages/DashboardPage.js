import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');

  const fetchVideo = useCallback(async () => {
    setVideoLoading(true);
    setVideoError('');
    try {
      const res = await axios.get('/api/session/video');
      if (res.data.success) {
        setVideoUrl(res.data.videoUrl);
      } else {
        setVideoError(res.data.message || 'Unable to load video.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        // Session invalidated (another device logged in)
        setVideoError('Session expired. Redirecting to login...');
        setTimeout(() => {
          logout();
          navigate('/login', { replace: true });
        }, 2000);
      } else if (err.response?.status === 403) {
        setVideoError(err.response?.data?.message || 'Access denied.');
      } else {
        setVideoError('Unable to load video. Please try again.');
      }
    } finally {
      setVideoLoading(false);
    }
  }, [logout, navigate]);

  const hasAccess = !!(user?.access || (user?.registrations && user.registrations.some(r => r.status === 'confirmed')));

  useEffect(() => {
    if (hasAccess) {
      fetchVideo();
    }
  }, [hasAccess, fetchVideo]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <div className="dashboard-header glass fade-up">
        <div className="dashboard-user-info">
          <div className="dashboard-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>Welcome, {user.name.split(' ')[0]}!</h2>
            <p className="dashboard-email">{user.email}</p>
          </div>
        </div>
        <button className="dashboard-logout-btn" onClick={handleLogout}>
          <span>↗</span> Logout
        </button>
      </div>

      {/* Content Area */}
      {hasAccess ? (
        /* ─── Paid User: Session Player ─── */
        <div className="session-player-section fade-up-2">
          <div className="session-player-header">
            <div className="access-badge">
              <span>✓</span> Full Access
            </div>
            <h1>Recorded Session</h1>
            <p>Your exclusive recorded session content is ready to watch.</p>
          </div>

          <div className="video-container glass" style={{ minHeight: 'auto' }}>
            {videoLoading ? (
              <div className="video-loading" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div className="spinner" />
                <p style={{ marginTop: '16px' }}>Loading your session access...</p>
              </div>
            ) : videoError ? (
              <div className="video-error" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <span className="video-error-icon" style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
                <p style={{ marginBottom: '20px' }}>{videoError}</p>
                <button className="retry-btn" onClick={fetchVideo}>
                  Try Again
                </button>
              </div>
            ) : videoUrl ? (
              <div className="video-player-layout">
                <div className="video-wrapper">
                  <iframe 
                    className="video-iframe"
                    src={typeof videoUrl === 'string' ? videoUrl.replace(/\/view(\?.*)?$/, '/preview') : ''}
                    allow="autoplay; encrypted-media" 
                    allowFullScreen
                    title="Session Recording"
                  ></iframe>
                </div>
                <div className="google-drive-access" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Your Access is Ready</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: '1.6' }}>
                    You can watch the recorded session directly above. This video has also been securely shared with your registered Gmail account.
                  </p>
                  <a 
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auth-submit-btn"
                    style={{ display: 'inline-flex', width: 'auto', textDecoration: 'none', marginTop: '8px' }}
                  >
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>↗</span> Open in Google Drive
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div className="session-info-cards">
            <div className="info-card glass fade-up-3">
              <div className="info-card-icon">🎯</div>
              <h3>Key Takeaways</h3>
              <p>Strategic insights and actionable frameworks from the session.</p>
            </div>
            <div className="info-card glass fade-up-3">
              <div className="info-card-icon">📝</div>
              <h3>Session Notes</h3>
              <p>Take notes while watching to maximize your learning outcome.</p>
            </div>
            <div className="info-card glass fade-up-4">
              <div className="info-card-icon">🔒</div>
              <h3>Exclusive Access</h3>
              <p>This content is exclusively available to verified members only.</p>
            </div>
          </div>
        </div>
      ) : user.registrations && user.registrations.length > 0 ? (
        /* ─── User has registered but access not yet granted ─── */
        <div className="purchase-section fade-up-2">
          <div className="purchase-card glass" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h2>Verification Pending</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '16px auto', lineHeight: '1.6' }}>
              We have received your registration for <strong>{user.registrations[0].plan === 'workshop' ? 'Group Workshop' : '1-on-1 Call'}</strong>. 
              Our team is currently verifying your payment. Your access will be activated within 24 hours.
            </p>
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'inline-block', marginTop: '20px' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Transaction ID</strong>
              <code style={{ color: 'var(--text-primary)' }}>{user.registrations[0].transactionId}</code>
            </div>
            <div style={{ marginTop: '32px' }}>
              <button className="refresh-btn" onClick={refreshUser} style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── User has not registered for anything yet ─── */
        <div className="purchase-section fade-up-2">
          <div className="purchase-card glass" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
            <h2>No Sessions Found</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '16px auto', lineHeight: '1.6' }}>
              It looks like you haven't registered for any sessions yet, or you haven't completed the payment form.
            </p>
            <button 
              onClick={() => navigate('/')}
              style={{ padding: '12px 24px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' }}
            >
              Explore Sessions on Home Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
