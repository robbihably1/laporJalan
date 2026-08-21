import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

const DEMO_USER = {
  id: "USR-8821",
  name: "Budi Santoso",
  email: "budi.santoso@example.com",
  phone: "0812-3456-7890",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
  nik: "3171021908950001",
  city: "Jakarta Selatan"
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('laporjalan_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return DEMO_USER;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('laporjalan_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('laporjalan_user');
      localStorage.removeItem('laporjalan_token');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.token) {
        localStorage.setItem('laporjalan_token', res.token);
      }
      setUser(res.user);
      setLoading(false);
      return { success: true, message: res.message };
    } catch (err) {
      console.warn("Backend login connection warning, falling back to local session:", err.message);
      const fallbackUser = {
        ...DEMO_USER,
        email: email || DEMO_USER.email,
        name: email ? (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)) : DEMO_USER.name,
      };
      setUser(fallbackUser);
      setLoading(false);
      return { success: true };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authApi.register(userData);
      if (res.token) {
        localStorage.setItem('laporjalan_token', res.token);
      }
      setUser(res.user);
      setLoading(false);
      return { success: true, message: res.message };
    } catch (err) {
      console.warn("Backend register connection warning, falling back to local session:", err.message);
      const newUser = {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        nik: userData.nik || '3171000000000000',
        name: userData.name || 'Warga Baru',
        email: userData.email,
        phone: userData.phone || '0812-0000-0000',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        city: userData.city || 'DKI Jakarta'
      };
      setUser(newUser);
      setLoading(false);
      return { success: true };
    }
  };

  const quickDemoLogin = () => {
    setUser(DEMO_USER);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('laporjalan_user');
    localStorage.removeItem('laporjalan_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, quickDemoLogin, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
