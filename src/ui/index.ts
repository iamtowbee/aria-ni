// src/ui/index.ts
/**
 * UI Library - Main Export
 * 
 * Complete design system with all components
 */

// Theme
export { ThemeProvider, useTheme } from './theme/ThemeProvider';
export { tokens, lightTheme, darkTheme } from './theme/tokens';
export type { Theme, ThemeColors } from './theme/tokens';

// Base Components
export { Button } from './base/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './base/Button';

export { Avatar } from './base/Avatar';
export type { AvatarProps, AvatarSize, AvatarVariant } from './base/Avatar';

export { Badge } from './base/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './base/Badge';

// Form Components
export { Input } from './forms/Input';
export type { InputProps } from './forms/Input';

export { Switch } from './forms/Switch';
export type { SwitchProps } from './forms/Switch';

export { Slider } from './forms/Slider';
export type { SliderProps } from './forms/Slider';

// Layout Components
export { Card } from './layout/Card';
export type { CardProps, CardVariant } from './layout/Card';

// Animations
export * from './animations/animations';

// Re-export smart components
export * from '../components/smart';
