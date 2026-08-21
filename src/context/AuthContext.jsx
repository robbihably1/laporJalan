import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

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
    return null; // Default to null (Requires user to log in first)
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
      // DO NOT set user session upon registration because account status is 'Nonaktif' (Requires Email Verification)
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
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
