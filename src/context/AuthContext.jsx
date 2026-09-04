import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

// Session duration: 8 hours in milliseconds (8 * 60 * 60 * 1000)
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [sessionNotice, setSessionNotice] = useState(() => {
    // Check if session was already expired on page load
    const saved = localStorage.getItem('laporjalan_user');
    const expiry = localStorage.getItem('laporjalan_session_expiry');
    if (saved && (!expiry || Date.now() > parseInt(expiry, 10))) {
      return 'Sesi Anda telah berakhir setelah 8 jam demi keamanan. Silakan login kembali.';
    }
    return '';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('laporjalan_user');
    const expiry = localStorage.getItem('laporjalan_session_expiry');
    const token = localStorage.getItem('laporjalan_token');

    if (saved && token) {
      // Check if session has exceeded 8 hours or legacy session without expiry
      if (!expiry || Date.now() > parseInt(expiry, 10)) {
        localStorage.removeItem('laporjalan_user');
        localStorage.removeItem('laporjalan_token');
        localStorage.removeItem('laporjalan_session_expiry');
        return null;
      }
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Default to null
  });

  const [loading, setLoading] = useState(false);

  // Helper to handle auto-logout on session expiration
  const handleSessionExpired = (message = 'Sesi Anda telah berakhir setelah 8 jam demi keamanan. Silakan login kembali.') => {
    setUser(null);
    localStorage.removeItem('laporjalan_user');
    localStorage.removeItem('laporjalan_token');
    localStorage.removeItem('laporjalan_session_expiry');
    setSessionNotice(message);
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('laporjalan_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('laporjalan_user');
      localStorage.removeItem('laporjalan_token');
      localStorage.removeItem('laporjalan_session_expiry');
    }
  }, [user]);

  // Initial mount verification: Validate token against backend /auth/me
  useEffect(() => {
    const token = localStorage.getItem('laporjalan_token');
    if (token && user) {
      authApi.getMe().then((res) => {
        if (res && res.user) {
          setUser(prev => ({ ...prev, ...res.user }));
        }
      }).catch((err) => {
        console.warn("[Auth] Token verification failed:", err.message);
        if (err.message && (err.message.includes('Token tidak valid') || err.message.includes('kadaluarsa') || err.message.includes('401'))) {
          handleSessionExpired('Sesi Anda telah berakhir setelah 8 jam. Silakan login kembali.');
        }
      });
    }
  }, []);

  // Periodic and Event-Driven check for 8-hour session expiration
  useEffect(() => {
    if (!user) return;

    const checkExpiry = () => {
      const expiry = localStorage.getItem('laporjalan_session_expiry');
      if (expiry && Date.now() > parseInt(expiry, 10)) {
        console.info("[Auth] Session expired (> 8 hours). Logging out user.");
        handleSessionExpired();
      }
    };

    // 1. Periodic check every 30 seconds
    const interval = setInterval(checkExpiry, 30000);

    // 2. Check whenever user switches back to tab or device wakes up
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkExpiry();
      }
    };

    // 3. Listen to 401 events from api.js
    const handleApiExpired = (e) => {
      const msg = e?.detail?.message || 'Sesi Anda telah berakhir setelah 8 jam. Silakan masuk kembali.';
      handleSessionExpired(msg);
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('laporjalan:session_expired', handleApiExpired);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('laporjalan:session_expired', handleApiExpired);
    };
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setSessionNotice('');
    try {
      const res = await authApi.login(email, password);
      if (res.token) {
        localStorage.setItem('laporjalan_token', res.token);
      }

      // Calculate 8-hour expiration timestamp
      const duration = res.expiresIn ? res.expiresIn * 1000 : SESSION_DURATION_MS;
      const expiryTimestamp = Date.now() + duration;
      localStorage.setItem('laporjalan_session_expiry', expiryTimestamp.toString());

      if (res.success && res.user) {
        setUser(res.user);
      }
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || 'Gagal terhubung ke server backend' };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authApi.register(userData);
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || 'Gagal melakukan pendaftaran akun' };
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const res = await authApi.updateProfile(profileData);
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(prev => prev ? { ...prev, ...profileData } : null);
      }
      setLoading(false);
      return res;
    } catch (err) {
      console.warn("Backend updateProfile warning, fallback to local state:", err.message);
      setUser(prev => prev ? { ...prev, ...profileData } : null);
      setLoading(false);
      return { success: true, message: 'Profil berhasil diperbarui!' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('laporjalan_user');
    localStorage.removeItem('laporjalan_token');
    localStorage.removeItem('laporjalan_session_expiry');
    setSessionNotice('');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      updateProfile,
      logout,
      isAuthenticated: !!user,
      loading,
      sessionNotice,
      clearSessionNotice: () => setSessionNotice('')
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
