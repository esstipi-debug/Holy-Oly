import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { themes, getThemeById, type ThemeDefinition } from '../themes';

interface ThemeContextType {
  currentTheme: ThemeDefinition;
  setTheme: (themeId: string) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeDefinition>(() => {
    const saved = localStorage.getItem('holyoly-theme');
    return saved ? getThemeById(saved) : themes[0];
  });

  const setTheme = useCallback((themeId: string) => {
    const theme = getThemeById(themeId);
    setCurrentTheme(theme);
    localStorage.setItem('holyoly-theme', theme.id);

    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply font family
    root.style.setProperty('--font-family', theme.variables['--font-family'] || 'Inter, system-ui, sans-serif');
    
    // Load Google Font if needed
    if (theme.googleFont) {
      const fontId = `google-font-${theme.id}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${theme.googleFont}&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, []);

  useEffect(() => {
    setTheme(currentTheme.id);
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
