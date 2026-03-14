// src/components/smart/index.ts
/**
 * Smart UI Component System
 * 
 * Intelligent, context-aware components for AI interactions
 */

// Inputs
export { SmartMessageInput } from './inputs/SmartMessageInput';
export type { 
  SmartMessageInputProps,
  MessageSuggestion,
} from './inputs/SmartMessageInput';

// Cards
export { AdaptiveMessageCard } from './cards/AdaptiveMessageCard';
export type {
  AdaptiveMessageCardProps,
  MessageContent,
} from './cards/AdaptiveMessageCard';

// Feedback
export { ContextActionSheet } from './feedback/ContextActionSheet';
export type {
  ContextActionSheetProps,
  ActionItem,
  ActionSection,
} from './feedback/ContextActionSheet';

export { SmartLoadingState } from './feedback/SmartLoadingState';
export type {
  SmartLoadingStateProps,
  LoadingStyle,
} from './feedback/SmartLoadingState';

// Navigation
export { SmartTabBar } from './navigation/SmartTabBar';
export type {
  SmartTabBarProps,
  TabItem,
} from './navigation/SmartTabBar';
