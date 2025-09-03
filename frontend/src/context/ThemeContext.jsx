import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('darkMode', 'true'); // Always save dark mode as true
    document.documentElement.classList.add('dark'); // Always apply dark mode
  }, []); // Empty dependency array means this runs once on mount

  return (
    <ThemeContext.Provider value={{ darkMode: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
