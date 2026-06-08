import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import YouTubePlayer from '../components/YouTubePlayer';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null); // { embedUrl, youtubeId }
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');

  const fetchVideo = useCallback(async () => {
    setVideoLoading(true);
    setVideoError('');
    try {
      // Step 1: get the signed stream token URL
      const res = await axios.get('/api/session/video');
      if (!res.data.success) {
        return setVideoError(res.data.message || 'Unable to load video.');
      }

      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const streamUrl = res.data.videoUrl.startsWith('http')
        ? res.data.videoUrl
        : `${apiBase}${res.data.videoUrl}`;

      // Step 2: exchange the token for the embed config
      const streamRes = await axios.get(streamUrl);
      if (streamRes.data.success) {
        setVideoData({
          embedUrl: streamRes.data.embedUrl,
          youtubeId: streamRes.data.youtubeId,
        });
      } else {
        setVideoError(streamRes.data.message || 'Unable to load video.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setVideoError('Session expired. Redirecting to login...');
        setTimeout(() => { logout(); navigate('/login', { replace: true }); }, 2000);
      } else if (err.response?.status === 403) {
        setVideoError(err.response?.data?.message || 'Access denied.');
      } else {
        setVideoError('Unable to load video. Please try again later.');
      }
    } finally {
      setVideoLoading(false);
    }
  }, [logout, navigate]);

  const hasAccess = !!(
    user?.access ||
    (user?.registrations && user.registrations.some((r) => r.status === 'confirmed'))
  );

  useEffect(() => {
    if (hasAccess) fetchVideo();
  }, [hasAccess, fetchVideo]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get('/api/session/resources', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Resources.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error downloading resources. Ensure you have access.');
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header glass fade-up">
        <div className="dashboard-user-info">
          <div className="dashboard-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h2>Welcome, {user.name.split(' ')[0]}!</h2>
            <p className="dashboard-email">{user.email}</p>
          </div>
        </div>
        <button className="dashboard-logout-btn" onClick={handleLogout}>
          <span>↗</span> Logout
        </button>
      </div>

      {hasAccess ? (
        <div className="session-player-section fade-up-2">
          <div className="session-player-header">
            <div className="access-badge"><span>✓</span> Full Premium Access</div>
            <h1>Your Enrolled Courses</h1>
            <p>Access your videos and bonus resources securely.</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            {/* Video Section */}
            <div style={{ flex: '1 1 600px' }}>
              <div className="video-container glass" style={{ minHeight: 'auto', padding: '10px' }}>
                {videoLoading ? (
                  <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <div className="spinner" />
                    <p style={{ marginTop: '16px' }}>Loading secure streaming module...</p>
                  </div>
                ) : videoError ? (
                  <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>{videoError}</p>
                    <button
                      onClick={fetchVideo}
                      style={{ marginTop: '16px', padding: '8px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Retry
                    </button>
                  </div>
                ) : videoData ? (
                  <YouTubePlayer
                    embedUrl={videoData.embedUrl}
                    studentName={user.name}
                    studentEmail={user.email}
                    purchaseId={user.id || 'TRX-987654321'}
                  />
                ) : null}
              </div>
            </div>

            {/* Resources Section */}
            <div style={{ flex: '1 1 300px' }}>
              <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Bonus Resources</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Download your included PDFs, cheat sheets, and templates.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📄</span>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>Complete Resources Bundle</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PDF • 5 MB</div>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadPDF}
                      style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="purchase-section fade-up-2">
          <div className="purchase-card glass" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>No Active Enrollments</h2>
            <button
              onClick={() => navigate('/')}
              style={{ marginTop: '20px', padding: '12px 24px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: '#fff' }}
            >
              Explore Courses
            </button>
          </div>
        </div>
      )}
    </div>
  );
}