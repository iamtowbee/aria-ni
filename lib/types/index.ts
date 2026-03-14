// lib/types/index.ts
/**
 * Complete Type Definitions for Aria-Nova Library
 */

// ==================== CORE TYPES ====================

export interface AgentConfig {
  sharedModel?: any;
  persona?: string;
  style?: string;
  [key: string]: any;
}

export interface AgentResponse {
  text: string;
  tokensGenerated?: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// ==================== ATTENTION ====================

export interface AttentionWeight {
  token: string;
  weight: number;
}

export interface AttentionData {
  weights: AttentionWeight[];
  confidence: number;
  focusTokens: string[];
}

// ==================== JOW (CHILD AI) ====================

export interface JowSkills {
  language: number;
  memory: number;
  emotion: number;
  knowledge: number;
}

export interface JowPersonality {
  playfulness: number;
  seriousness: number;
  helpfulness: number;
  independence: number;
  curiosity: number;
}

export interface JowMilestones {
  firstWords: boolean;
  firstQuestion: boolean;
  emotionRecognition: boolean;
  independentThought: boolean;
  maturity: boolean;
}

export interface JowState {
  age: number;
  skills: JowSkills;
  personality: JowPersonality;
  milestones: JowMilestones;
}

// ==================== MEMORY ====================

export interface VectorEntry {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface MemoryEntry {
  text: string;
  embedding?: number[];
  timestamp: number;
  importance?: number;
}

export interface MemoryStats {
  vectorCount: number;
  contextSize: number;
  compressionRatio?: number;
}

// ==================== CACHE ====================

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

// ==================== EMOTIONS ====================

export interface Emotion {
  id: string;
  label: string;
  intensity: number;
  valence?: number; // -1 to 1
  arousal?: number; // -1 to 1
}

export interface EmotionResult {
  emotion: Emotion;
  confidence: number;
  alternatives?: Emotion[];
}

// ==================== VOICE ====================

export interface VoiceConfig {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

export interface VoiceCommand {
  trigger: string;
  action: string;
  params?: any;
}

// ==================== SUGGESTIONS ====================

export interface Suggestion {
  type: 'context' | 'followup' | 'pattern' | 'capability';
  text: string;
  confidence: number;
  action?: string;
}

// ==================== MULTI-MODAL ====================

export interface MultiModalInput {
  text?: string;
  image?: string; // base64 or URL
  audio?: string; // base64 or URL
  metadata?: Record<string, any>;
}

export interface MultiModalResponse {
  text: string;
  imageAnalysis?: any;
  audioTranscript?: string;
  combined: boolean;
}

// ==================== SUBSCRIPTION ====================

export enum SubscriptionTier {
  FREE = 'free',
  PLUS = 'plus',
  PRO = 'pro',
  ULTIMATE = 'ultimate',
}

export interface SubscriptionLimits {
  dailyMessages: number;
  contextWindow: number;
  messageHistory: number;
  avatarSlots: number;
  petSlots: number;
  themeSlots: number;
}

export interface SubscriptionFeatures {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  features: {
    voiceCommands: boolean;
    multiModal: boolean;
    splitScreen: boolean;
    dataVisualization: boolean;
    customAvatars: boolean;
    customPets: boolean;
    customThemes: boolean;
    exportConversations: boolean;
    prioritySupport: boolean;
    reflectiveMode: boolean;
    advancedReasoning: boolean;
    expertPersonalities: boolean;
    collaborativeMode: boolean;
  };
  price: {
    monthly: number;
    yearly: number;
  };
}

// ==================== SHOP ====================

export enum ItemCategory {
  AVATAR = 'avatar',
  PET = 'pet',
  THEME = 'theme',
  CAPABILITY = 'capability',
  BOOST = 'boost',
}

export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  description: string;
  price: number;
  requiredTier?: string;
  previewUrl?: string;
  benefits?: string[];
  enhancementType?: 'memory' | 'reasoning' | 'creativity' | 'emotion';
  multiplier?: number;
  duration?: number;
}

// ==================== AGENT STATUS ====================

export interface AgentStatus {
  name: string;
  ready: boolean;
  active: boolean;
  lastActivity?: number;
}

// ==================== ECOSYSTEM ====================

export interface EcosystemConfig {
  cacheSize?: number;
  contextWindow?: number;
  temperature?: number;
  maxTokens?: number;
  enableVoice?: boolean;
  enableMultiModal?: boolean;
  subscriptionTier?: SubscriptionTier;
}

export interface EcosystemStatus {
  initialized: boolean;
  agents: AgentStatus[];
  cache: CacheStats;
  memory: MemoryStats;
  jow?: JowState;
}

export interface ThinkOptions {
  stream?: boolean;
  onStream?: (token: string, currentText: string) => void;
  skipCache?: boolean;
  returnAttention?: boolean;
  emotion?: string;
}

export interface ThinkResponse {
  text: string;
  attention?: AttentionWeight[];
  confidence?: number;
  jow?: JowState;
  emotionResult?: EmotionResult;
  suggestions?: Suggestion[];
  cached?: boolean;
  source?: string;
}

// ==================== EVENTS ====================

export interface AgentEvent {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
}

export type AgentEventHandler = (event: AgentEvent) => void;

// ==================== UTILITIES ====================

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// ==================== EXPORTS ====================

export type {
  AgentConfig,
  AgentResponse,
  Message,
  VectorEntry,
  MemoryEntry,
  Emotion,
  VoiceConfig,
  VoiceCommand,
  MultiModalInput,
  MultiModalResponse,
};
