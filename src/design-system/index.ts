// src/design-system/index.ts
/**
 * Modern Design System - Exports
 * 
 * Complete design system with:
 * - Design tokens
 * - Components
 * - Utilities
 * - Hooks
 */

// Tokens
export * from './tokens';

// Components
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Card, CardHeader, CardBody, CardFooter } from './components/Card';
export type { CardProps } from './components/Card';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

// Re-export everything for convenience
export * as DesignSystem from './tokens';
