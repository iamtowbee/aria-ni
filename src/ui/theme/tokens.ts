// src/ui/theme/tokens.ts
/**
 * Design Tokens
 * 
 * Core design system values used throughout the app
 */

export const tokens = {
  // Colors
  colors: {
    // Primary
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    
    // Neutral
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      1000: '#000000',
    },
    
    // Semantic
    success: {
      light: '#4ADE80',
      main: '#22C55E',
      dark: '#16A34A',
    },
    
    error: {
      light: '#F87171',
      main: '#EF4444',
      dark: '#DC2626',
    },
    
    warning: {
      light: '#FBBF24',
      main: '#F59E0B',
      dark: '#D97706',
    },
    
    info: {
      light: '#60A5FA',
      main: '#3B82F6',
      dark: '#2563EB',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Spacing
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },
  
  // Border Radius
  radius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  
  // Z-Index
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  },
  
  // Transitions
  transitions: {
    duration: {
      fast: 150,
      base: 200,
      slow: 300,
      slower: 500,
    },
    easing: {
      ease: [0.25, 0.1, 0.25, 1],
      easeIn: [0.42, 0, 1, 1],
      easeOut: [0, 0, 0.58, 1],
      easeInOut: [0.42, 0, 0.58, 1],
    },
  },
};

// Theme type
export type Theme = 'light' | 'dark' | 'auto';

// Light theme
export const lightTheme = {
  colors: {
    background: tokens.colors.neutral[0],
    surface: tokens.colors.neutral[50],
    surfaceVariant: tokens.colors.neutral[100],
    
    text: {
      primary: tokens.colors.neutral[900],
      secondary: tokens.colors.neutral[600],
      tertiary: tokens.colors.neutral[500],
      disabled: tokens.colors.neutral[400],
    },
    
    border: {
      light: tokens.colors.neutral[200],
      main: tokens.colors.neutral[300],
      dark: tokens.colors.neutral[400],
    },
    
    primary: tokens.colors.primary[600],
    primaryHover: tokens.colors.primary[700],
    primaryActive: tokens.colors.primary[800],
    
    success: tokens.colors.success.main,
    error: tokens.colors.error.main,
    warning: tokens.colors.warning.main,
    info: tokens.colors.info.main,
  },
};

// Dark theme
export const darkTheme = {
  colors: {
    background: tokens.colors.neutral[900],
    surface: tokens.colors.neutral[800],
    surfaceVariant: tokens.colors.neutral[700],
    
    text: {
      primary: tokens.colors.neutral[50],
      secondary: tokens.colors.neutral[300],
      tertiary: tokens.colors.neutral[400],
      disabled: tokens.colors.neutral[500],
    },
    
    border: {
      light: tokens.colors.neutral[700],
      main: tokens.colors.neutral[600],
      dark: tokens.colors.neutral[500],
    },
    
    primary: tokens.colors.primary[400],
    primaryHover: tokens.colors.primary[300],
    primaryActive: tokens.colors.primary[200],
    
    success: tokens.colors.success.light,
    error: tokens.colors.error.light,
    warning: tokens.colors.warning.light,
    info: tokens.colors.info.light,
  },
};

export type ThemeColors = typeof lightTheme.colors;
