import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Default to 'light' if no cache/localStorage exists!
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('laporjalan_theme') || 'light';
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('laporjalan_theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark');
      document.body.classList.add('light-mode-active');
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark');
      document.body.classList.remove('light-mode-active');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
