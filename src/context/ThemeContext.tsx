import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light';
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light' });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('swarna-theme');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};
