// src/types/legacy-types.d.ts
/**
 * Type definitions for legacy Aria AI code
 * These types allow gradual migration to strict TypeScript
 */

// ==================== COMMON TYPES ====================

export type Any = any; // Explicit any for legacy code

export interface GenericConfig {
  [key: string]: any;
}

export interface GenericResult {
  [key: string]: any;
}

// ==================== AGENT TYPES ====================

export interface AgentMessage {
  role?: string;
  content?: string;
  text?: string;
  [key: string]: any;
}

export interface AgentContext {
  memories?: any[];
  history?: any[];
  emotionContext?: any;
  [key: string]: any;
}

export interface AgentOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  onStream?: (token: string, current: string) => void;
  [key: string]: any;
}

// ==================== ARIA AI TYPES ====================

export interface AriaConfig {
  dModel?: number;
  nHeads?: number;
  nLayers?: number;
  maxSeqLen?: number;
  vocabSize?: number;
  dropout?: number;
  [key: string]: any;
}

export interface AriaVector {
  id?: string;
  vector: number[] | Float32Array;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface AriaMemory {
  text?: string;
  embedding?: number[] | Float32Array;
  timestamp?: number;
  importance?: number;
  [key: string]: any;
}

export interface AriaAttention {
  tokens?: string[];
  weights?: number[] | Float32Array;
  [key: string]: any;
}

// ==================== TRAINING TYPES ====================

export interface TrainingConfig {
  learningRate?: number;
  epochs?: number;
  batchSize?: number;
  [key: string]: any;
}

export interface TrainingData {
  input?: any;
  target?: any;
  [key: string]: any;
}

// ==================== MODEL TYPES ====================

export interface ModelConfig {
  modelPath?: string;
  nPredict?: number;
  temperature?: number;
  nCtx?: number;
  nThreads?: number;
  [key: string]: any;
}

export interface ModelResult {
  text?: string;
  tokens?: number;
  latency?: number;
  [key: string]: any;
}

// ==================== VECTOR STORE TYPES ====================

export interface VectorStoreEntry {
  id: string;
  vector: number[] | Float32Array;
  text?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface VectorSearchResult {
  id: string;
  distance: number;
  text?: string;
  metadata?: Record<string, any>;
}

// ==================== EMOTION TYPES ====================

export interface EmotionData {
  id?: string;
  label?: string;
  intensity?: number;
  valence?: number;
  arousal?: number;
  [key: string]: any;
}

// ==================== JOW TYPES ====================

export interface JowConfig {
  parentModel?: any;
  learningRate?: number;
  [key: string]: any;
}

export interface JowSkillData {
  language?: number;
  memory?: number;
  emotion?: number;
  knowledge?: number;
  [key: string]: any;
}

export interface JowPersonalityData {
  playfulness?: number;
  seriousness?: number;
  helpfulness?: number;
  independence?: number;
  curiosity?: number;
  [key: string]: any;
}

// ==================== HELPER TYPES ====================

export type Callback<T = void> = (data: T) => void;
export type AsyncCallback<T = void> = (data: T) => Promise<void>;

export interface ProgressCallback {
  (progress: { stage: string; percent: number }): void;
}

export interface StreamCallback {
  (token: string, fullText: string): void;
}

// ==================== TENSOR TYPES (for TensorFlow.js) ====================

export interface TensorLike {
  shape?: number[];
  dtype?: string;
  data?: any;
  [key: string]: any;
}

export interface LayerConfig {
  units?: number;
  activation?: string;
  inputShape?: number[];
  [key: string]: any;
}

// ==================== UTILITY TYPES ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type Nullable<T> = T | null | undefined;

// ==================== CLASS PROPERTY DECORATORS ====================

// For classes with dynamic properties
export interface DynamicProperties {
  [key: string]: any;
}

// ==================== GLOBAL AUGMENTATIONS ====================

declare global {
  interface Window {
    storage?: any;
  }
}

export {};
