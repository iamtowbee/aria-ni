// src/features/theme/ThemeSystem.ts
/**
 * Advanced Theme System with Dark/Light Mode
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

// ==================== THEME TYPES ====================

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    // Primary
    primary: string;
    primaryDark: string;
    primaryLight: string;
    
    // Background
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    
    // Surface
    surface: string;
    surfaceHover: string;
    
    // Text
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    
    // Borders
    border: string;
    borderLight: string;
    
    // Status
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // AI specific
    aiGlow: string;
    orbIdle: string;
    orbListening: string;
    orbThinking: string;
    orbSpeaking: string;
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  
  shadows: {
    sm: object;
    md: object;
    lg: object;
    xl: object;
  };
}

// ==================== THEME DEFINITIONS ====================

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#6C63FF',
    primaryDark: '#5548E6',
    primaryLight: '#8B84FF',
    
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F7',
    backgroundTertiary: '#ECECEE',
    
    surface: '#FFFFFF',
    surfaceHover: '#F9F9FB',
    
    text: '#1C1C1E',
    textSecondary: '#636366',
    textTertiary: '#8E8E93',
    textInverse: '#FFFFFF',
    
    border: '#D1D1D6',
    borderLight: '#E5E5EA',
    
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    aiGlow: '#6C63FF',
    orbIdle: '#8E8E93',
    orbListening: '#34C759',
    orbThinking: '#6C63FF',
    orbSpeaking: '#007AFF',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  mode: 'dark',
  colors: {
    primary: '#6C63FF',
    primaryDark: '#5548E6',
    primaryLight: '#8B84FF',
    
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',
    
    surface: '#1C1C1E',
    surfaceHover: '#2C2C2E',
    
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#8E8E93',
    textInverse: '#000000',
    
    border: '#38383A',
    borderLight: '#48484A',
    
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
    
    aiGlow: '#8B84FF',
    orbIdle: '#8E8E93',
    orbListening: '#30D158',
    orbThinking: '#8B84FF',
    orbSpeaking: '#0A84FF',
  },
};

// ==================== THEME CONTEXT ====================

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ==================== THEME PROVIDER ====================

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode = 'auto' }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() || 'light'
  );

  // Load saved theme preference
  useEffect(() => {
    AsyncStorage.getItem('@theme_mode').then((saved) => {
      if (saved) setThemeModeState(saved as ThemeMode);
    });
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  // Save theme preference
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem('@theme_mode', mode);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  // Determine actual theme
  const actualMode = themeMode === 'auto' ? systemTheme : themeMode;
  const theme = actualMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ==================== HOOKS ====================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function useThemedStyles<T>(
  styleFactory: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return styleFactory(theme);
}

// ==================== EXPORTS ====================

export { ThemeContext };
