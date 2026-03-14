// src/store/subscription/SubscriptionTiers.ts
/**
 * Subscription Tiers & Features
 * 
 * FREE → PLUS → PRO → ULTIMATE
 */

export enum SubscriptionTier {
  FREE = 'free',
  PLUS = 'plus',
  PRO = 'pro',
  ULTIMATE = 'ultimate',
}

export interface SubscriptionFeatures {
  // Conversation Limits
  dailyMessages: number;
  contextWindow: number; // tokens
  messageHistory: number; // days
  
  // AI Capabilities
  responseSpeed: 'standard' | 'fast' | 'instant';
  attentionQuality: 'basic' | 'enhanced' | 'advanced' | 'supreme';
  creativityLevel: 'standard' | 'enhanced' | 'professional';
  emotionalIntelligence: 'basic' | 'advanced' | 'expert';
  
  // Memory & Learning
  memoryRetention: number; // days
  vectorSearchResults: number;
  jowGrowthRate: number; // multiplier
  selfLearningSpeed: 'slow' | 'medium' | 'fast' | 'instant';
  
  // Features
  voiceCommands: boolean;
  multiModal: boolean;
  splitScreen: boolean;
  dataVisualization: boolean;
  customAvatars: boolean;
  customPets: boolean;
  customThemes: boolean;
  exportConversations: boolean;
  prioritySupport: boolean;
  
  // Limits
  avatarSlots: number;
  petSlots: number;
  themeSlots: number;
  
  // Premium Features
  reflectiveMode: boolean; // Deep introspection
  advancedReasoning: boolean; // Multi-step thinking
  expertPersonalities: boolean; // Professor, Therapist, etc
  collaborativeMode: boolean; // Multi-AI conversations
  
  // Price
  price: {
    monthly: number;
    yearly: number;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionFeatures> = {
  [SubscriptionTier.FREE]: {
    dailyMessages: 50,
    contextWindow: 2048,
    messageHistory: 7,
    
    responseSpeed: 'standard',
    attentionQuality: 'basic',
    creativityLevel: 'standard',
    emotionalIntelligence: 'basic',
    
    memoryRetention: 7,
    vectorSearchResults: 3,
    jowGrowthRate: 1.0,
    selfLearningSpeed: 'slow',
    
    voiceCommands: false,
    multiModal: false,
    splitScreen: false,
    dataVisualization: false,
    customAvatars: false,
    customPets: false,
    customThemes: false,
    exportConversations: false,
    prioritySupport: false,
    
    avatarSlots: 1,
    petSlots: 1,
    themeSlots: 1,
    
    reflectiveMode: false,
    advancedReasoning: false,
    expertPersonalities: false,
    collaborativeMode: false,
    
    price: { monthly: 0, yearly: 0 },
  },
  
  [SubscriptionTier.PLUS]: {
    dailyMessages: 200,
    contextWindow: 4096,
    messageHistory: 30,
    
    responseSpeed: 'fast',
    attentionQuality: 'enhanced',
    creativityLevel: 'enhanced',
    emotionalIntelligence: 'advanced',
    
    memoryRetention: 30,
    vectorSearchResults: 8,
    jowGrowthRate: 1.5,
    selfLearningSpeed: 'medium',
    
    voiceCommands: true,
    multiModal: true,
    splitScreen: true,
    dataVisualization: true,
    customAvatars: true,
    customPets: false,
    customThemes: true,
    exportConversations: true,
    prioritySupport: false,
    
    avatarSlots: 3,
    petSlots: 1,
    themeSlots: 5,
    
    reflectiveMode: false,
    advancedReasoning: false,
    expertPersonalities: false,
    collaborativeMode: false,
    
    price: { monthly: 9.99, yearly: 99 },
  },
  
  [SubscriptionTier.PRO]: {
    dailyMessages: 1000,
    contextWindow: 8192,
    messageHistory: 90,
    
    responseSpeed: 'instant',
    attentionQuality: 'advanced',
    creativityLevel: 'professional',
    emotionalIntelligence: 'expert',
    
    memoryRetention: 90,
    vectorSearchResults: 15,
    jowGrowthRate: 2.0,
    selfLearningSpeed: 'fast',
    
    voiceCommands: true,
    multiModal: true,
    splitScreen: true,
    dataVisualization: true,
    customAvatars: true,
    customPets: true,
    customThemes: true,
    exportConversations: true,
    prioritySupport: true,
    
    avatarSlots: 10,
    petSlots: 5,
    themeSlots: 20,
    
    reflectiveMode: true,
    advancedReasoning: true,
    expertPersonalities: true,
    collaborativeMode: false,
    
    price: { monthly: 19.99, yearly: 199 },
  },
  
  [SubscriptionTier.ULTIMATE]: {
    dailyMessages: -1, // unlimited
    contextWindow: 16384,
    messageHistory: 365,
    
    responseSpeed: 'instant',
    attentionQuality: 'supreme',
    creativityLevel: 'professional',
    emotionalIntelligence: 'expert',
    
    memoryRetention: 365,
    vectorSearchResults: 25,
    jowGrowthRate: 3.0,
    selfLearningSpeed: 'instant',
    
    voiceCommands: true,
    multiModal: true,
    splitScreen: true,
    dataVisualization: true,
    customAvatars: true,
    customPets: true,
    customThemes: true,
    exportConversations: true,
    prioritySupport: true,
    
    avatarSlots: -1, // unlimited
    petSlots: -1, // unlimited
    themeSlots: -1, // unlimited
    
    reflectiveMode: true,
    advancedReasoning: true,
    expertPersonalities: true,
    collaborativeMode: true,
    
    price: { monthly: 49.99, yearly: 499 },
  },
};

// Helper functions
export const getSubscriptionFeatures = (tier: SubscriptionTier): SubscriptionFeatures => {
  return SUBSCRIPTION_TIERS[tier];
};

export const canAccess = (userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean => {
  const tiers = [
    SubscriptionTier.FREE,
    SubscriptionTier.PLUS,
    SubscriptionTier.PRO,
    SubscriptionTier.ULTIMATE,
  ];
  
  return tiers.indexOf(userTier) >= tiers.indexOf(requiredTier);
};

export const getUpgradeDiscount = (currentTier: SubscriptionTier, targetTier: SubscriptionTier): number => {
  const discounts: Record<string, number> = {
    'free-plus': 0,
    'free-pro': 10,
    'free-ultimate': 20,
    'plus-pro': 15,
    'plus-ultimate': 25,
    'pro-ultimate': 20,
  };
  
  return discounts[`${currentTier}-${targetTier}`] || 0;
};
