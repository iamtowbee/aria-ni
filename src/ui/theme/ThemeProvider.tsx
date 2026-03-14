// src/ui/theme/ThemeProvider.tsx
/**
 * Theme Provider
 * 
 * Manages theme state and provides theme context to all components
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme, ThemeColors, tokens } from './tokens';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  tokens: typeof tokens;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const THEME_STORAGE_KEY = '@aria_nova_theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'auto',
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Determine actual theme
  const actualTheme = theme === 'auto' 
    ? (systemColorScheme || 'light')
    : theme;

  const isDark = actualTheme === 'dark';
  const colors = isDark ? darkTheme.colors : lightTheme.colors;

  const value: ThemeContextValue = {
    theme,
    isDark,
    colors,
    tokens,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
