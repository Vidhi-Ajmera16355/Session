import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Deduplication: if multiple callers invoke checkAuth simultaneously, reuse the same in-flight promise
  const pendingAuthRef = useRef(null);

  // Check if user is already logged in (cookie-based session restore)
  const checkAuth = useCallback(async () => {
    // If already in-flight, return the same promise — no duplicate DB hit
    if (pendingAuthRef.current) return pendingAuthRef.current;

    const promise = axios.get('/api/auth/me')
      .then(res => {
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        pendingAuthRef.current = null;
        setLoading(false);
      });

    pendingAuthRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const register = async (name, email, password) => {
    const res = await axios.post('/api/auth/register', { name, email, password });
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch {
      // Even if server call fails, clear local state
    }
    setUser(null);
  };

  // Refresh user data (e.g., after access is granted)
  const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

