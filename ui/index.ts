// ui/index.ts
/**
 * Aria-Nova UI Components
 * 
 * React Native UI components separated from core logic
 * Import only what you need for your UI
 */

import { ComponentType } from 'react';

// ==================== TYPES ====================

export interface ChatScreenProps {
  ecosystem: any;
}

export interface SubscriptionScreenProps {
  currentTier: string;
  onUpgrade: (tier: string, isYearly: boolean) => Promise<void>;
}

export interface ShopScreenProps {
  userTier: string;
  ownedItems: string[];
  onPurchase: (item: any) => Promise<void>;
}

export interface VoiceOrbProps {
  audioData: Float32Array | null;
  amplitude: number;
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: number;
}

export interface AvatarCanvasProps {
  emotion: string;
  isThinking?: boolean;
  isSpeaking?: boolean;
  style?: any;
}

export interface AttentionMapProps {
  attention: Array<{ token: string; weight: number }>;
  style?: any;
}

// ==================== SCREENS ====================

export { default as ChatScreen } from './screens/ChatScreen';
export { default as ChatScreenEnhanced } from './screens/ChatScreen-Enhanced';
export { default as SettingsScreen } from './screens/SettingsScreen';
export { default as SubscriptionScreen } from './screens/SubscriptionScreen';
export { default as ShopScreen } from './screens/ShopScreen';

// ==================== COMPONENTS ====================

// Nova Components
export { default as AnimatedAvatar } from './components/AnimatedAvatar';
export { default as DataVisualization } from './components/DataVisualization';
export { default as MultiModalInput } from './components/MultiModalInput';
export { default as SplitScreenView } from './components/SplitScreenView';

// Voice Orb
export { useVoiceOrb } from './components/voice-orb/useVoiceOrb';
export { VoiceOrb } from './components/voice-orb/VoiceOrb';
export { VoiceOrbProvider } from './components/voice-orb/VoiceOrbProvider';

// Lottie Avatar
export { default as Lottie3DMapper } from './components/lottie-avatar/Lottie3DMapper';
export { AvatarCanvas } from './components/lottie-avatar/AvatarCanvas';
export { AttentionMap } from './components/lottie-avatar/AttentionMap';

// ==================== HOOKS ====================

export type { VoiceOrbState } from './components/voice-orb/useVoiceOrb';

// ==================== COMPONENT BUNDLES ====================

/**
 * Get all screen components
 */
export const getAllScreens = () => ({
  Chat: require('./screens/ChatScreen').default,
  ChatEnhanced: require('./screens/ChatScreen-Enhanced').default,
  Settings: require('./screens/SettingsScreen').default,
  Subscription: require('./screens/SubscriptionScreen').default,
  Shop: require('./screens/ShopScreen').default,
});

/**
 * Get all UI components
 */
export const getAllComponents = () => ({
  AnimatedAvatar: require('./components/AnimatedAvatar').default,
  DataVisualization: require('./components/DataVisualization').default,
  MultiModalInput: require('./components/MultiModalInput').default,
  SplitScreenView: require('./components/SplitScreenView').default,
  VoiceOrb: require('./components/voice-orb/VoiceOrb').VoiceOrb,
  AvatarCanvas: require('./components/lottie-avatar/AvatarCanvas').AvatarCanvas,
  AttentionMap: require('./components/lottie-avatar/AttentionMap').AttentionMap,
});

/**
 * UI Component Registry
 * Use this to dynamically load components
 */
export interface UIRegistry {
  screens: {
    [key: string]: ComponentType<any>;
  };
  components: {
    [key: string]: ComponentType<any>;
  };
}

export const createUIRegistry = (): UIRegistry => ({
  screens: getAllScreens(),
  components: getAllComponents(),
});
