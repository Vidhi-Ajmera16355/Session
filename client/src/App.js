import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Hero from './components/Hero';
import Journey from './components/Journey';
import WhatYouGet from './components/WhatYouGet';
import Pricing from './components/Pricing';
import RegistrationForm from './components/RegistrationForm';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [selectedPlan, setSelectedPlan] = useState('workshop');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      return mql.matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const scrollToForm = (plan) => {
    setSelectedPlan(plan || 'workshop');
    setTimeout(() => {
      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Check if current route is an auth page (login/register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboardPage = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';

  const s = {
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 64,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.3s, border-color 0.3s',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    logo: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 800,
      fontSize: 18,
      letterSpacing: '-0.3px',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      textDecoration: 'none',
    },
    logoDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--primary)',
    },
    navRight: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    themeBtn: {
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
      width: 40,
      height: 40,
      borderRadius: '50%',
      fontSize: 18,
      boxShadow: 'var(--shadow-sm)',
    },
    authLink: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 600,
      fontSize: 14,
      padding: '8px 20px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--primary)',
      color: '#fff',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
    },
    main: {
      paddingTop: 64,
    },
  };

  if (isAdminPage) {
    return (
      <div>
        <header style={s.header} className="glass">
          <div className="container" style={{ width: '100%' }}>
            <div style={s.nav}>
              <Link 
                to="/"
                style={s.logo}
              >
                <div style={s.logoDot} />
                <span>Internship Playbook <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 4, marginLeft: 4 }}>Admin</span></span>
              </Link>
              <button 
                style={s.themeBtn} 
                onClick={toggleTheme}
                aria-label="Toggle dark/light theme"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </header>
        <main style={s.main}>
          <AdminPanel theme={theme} />
        </main>
      </div>
    );
  }

  return (
    <div>
      <header style={s.header} className="glass">
        <div className="container" style={{ width: '100%' }}>
          <div style={s.nav}>
            <Link to="/" style={s.logo}>
              <div style={s.logoDot} />
              <span>Internship Playbook</span>
            </Link>
            <div style={s.navRight}>
              {!loading && (
                user ? (
                  <Link to="/dashboard" style={s.authLink}>
                    Session Recording
                  </Link>
                ) : (
                  !isAuthPage && (
                    <Link to="/login" style={s.authLink}>
                      Login
                    </Link>
                  )
                )
              )}
              <button 
                style={s.themeBtn} 
                onClick={toggleTheme}
                aria-label="Toggle dark/light theme"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main style={s.main}>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={
            <>
              <Hero onCTA={scrollToForm} />
              <Journey />
              <WhatYouGet />
              <Pricing onSelect={scrollToForm} />
              <RegistrationForm selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
              <Footer />
            </>
          } />

          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
