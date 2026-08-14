import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Default logged in with DEMO_USER for smooth initial test, or user can toggle login/logout
    return DEMO_USER;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('laporjalan_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('laporjalan_user');
    }
  }, [user]);

  const login = (email, password) => {
    // Simulated login logic
    const newUser = {
      ...DEMO_USER,
      email: email || DEMO_USER.email,
      name: email ? email.split('@')[0] : DEMO_USER.name,
    };
    setUser(newUser);
    return { success: true };
  };

  const quickDemoLogin = () => {
    setUser(DEMO_USER);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, quickDemoLogin, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
