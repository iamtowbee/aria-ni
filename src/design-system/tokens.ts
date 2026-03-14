// src/design-system/tokens.ts
/**
 * Design Tokens - Modern Design System
 * 
 * Based on:
 * - Material Design 3 (Material You)
 * - iOS Human Interface Guidelines
 * - Fluent Design System
 * - Radix UI primitives
 */

export const colors = {
  // Primary brand colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  
  // Accent colors
  accent: {
    purple: '#9C27B0',
    pink: '#E91E63',
    teal: '#009688',
    orange: '#FF9800',
    green: '#4CAF50',
  },
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral palette (adaptive)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
    1000: '#000000',
  },
  
  // Glass morphism
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    forest: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
};

export const typography = {
  // Font families
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, "Fira Code", Consolas, monospace',
    display: 'Cal Sans, "SF Pro Display", sans-serif',
  },
  
  // Type scale (1.250 - Major Third)
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  
  // Line heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  tracking: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
};

export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  // Modern elevation system
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  
  // Colored shadows
  glow: {
    primary: '0 0 20px rgba(33, 150, 243, 0.4)',
    success: '0 0 20px rgba(16, 185, 129, 0.4)',
    error: '0 0 20px rgba(239, 68, 68, 0.4)',
  },
};

export const animations = {
  // Durations
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Presets
  presets: {
    fadeIn: {
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
    slideUp: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    scale: {
      duration: '150ms',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};

export const breakpoints = {
  xs: 320,   // Mobile portrait
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet portrait
  lg: 1024,  // Tablet landscape
  xl: 1280,  // Desktop
  '2xl': 1536, // Large desktop
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: {
      sm: '0 12px',
      md: '0 16px',
      lg: '0 24px',
    },
  },
  
  input: {
    height: {
      sm: '36px',
      md: '44px',
      lg: '52px',
    },
  },
  
  card: {
    padding: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    },
  },
};

// Dark mode mappings
export const darkMode = {
  background: colors.neutral[950],
  surface: colors.neutral[900],
  surfaceVariant: colors.neutral[800],
  text: colors.neutral[50],
  textSecondary: colors.neutral[400],
  border: colors.neutral[700],
};

export const lightMode = {
  background: colors.neutral[0],
  surface: colors.neutral[50],
  surfaceVariant: colors.neutral[100],
  text: colors.neutral[900],
  textSecondary: colors.neutral[600],
  border: colors.neutral[200],
};
