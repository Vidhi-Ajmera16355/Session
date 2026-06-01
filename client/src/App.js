import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import Journey from './components/Journey';
import WhatYouGet from './components/WhatYouGet';
import Pricing from './components/Pricing';
import RegistrationForm from './components/RegistrationForm';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setIsAdmin(true);
    }
  }, []);
  const [selectedPlan, setSelectedPlan] = useState('workshop');
  const [theme, setTheme] = useState(() => {
    // Default to system preference or light
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
    },
    logoDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--primary)',
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
    main: {
      paddingTop: 64,
    }
  };

  if (isAdmin) {
    return (
      <div>
        <header style={s.header} className="glass">
          <div className="container" style={{ width: '100%' }}>
            <div style={s.nav}>
              <div 
                style={{ ...s.logo, cursor: 'pointer' }}
                onClick={() => { window.location.pathname = '/'; }}
              >
                <div style={s.logoDot} />
                <span>Internship Playbook <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 4, marginLeft: 4 }}>Admin</span></span>
              </div>
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
            <div style={s.logo}>
              <div style={s.logoDot} />
              <span>Internship Playbook</span>
            </div>
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
        <Hero onCTA={scrollToForm} />
        <Journey />
        <WhatYouGet />
        <Pricing onSelect={scrollToForm} />
        <RegistrationForm selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
        <Footer />
      </main>
    </div>
  );
}
