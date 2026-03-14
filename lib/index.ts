// lib/index.ts
/**
 * Aria-Nova AI Library
 * 
 * Core AI functionality separated from UI
 * Use this as a standalone library in any React Native or Node.js project
 */

// ==================== TYPES ====================

export interface AIConfig {
  cacheSize?: number;
  contextWindow?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface ThinkOptions {
  stream?: boolean;
  onStream?: (token: string, currentText: string) => void;
  skipCache?: boolean;
  returnAttention?: boolean;
}

export interface ThinkResponse {
  text: string;
  attention?: AttentionWeight[];
  confidence?: number;
  jow?: JowStats;
  emotionResult?: EmotionResult;
  suggestions?: string[];
  cached?: boolean;
}

export interface AttentionWeight {
  token: string;
  weight: number;
}

export interface JowStats {
  age: number;
  skills: {
    language: number;
    memory: number;
    emotion: number;
    knowledge: number;
  };
  personality: {
    playfulness: number;
    seriousness: number;
    helpfulness: number;
    independence: number;
    curiosity: number;
  };
}

export interface EmotionResult {
  emotion: {
    id: string;
    label: string;
    intensity: number;
  };
}

export interface EcosystemStatus {
  initialized: boolean;
  agents: AgentStatus[];
  cache: CacheStats;
  memory: MemoryStats;
}

export interface AgentStatus {
  name: string;
  ready: boolean;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
}

export interface MemoryStats {
  vectorCount: number;
  contextSize: number;
}

// ==================== CORE EXPORTS ====================

export { createAIEcosystem } from './core/AIEcosystem';
export { UnifiedAIEcosystem } from './core/AIEcosystem-Unified';
export { AriaNovaCore, createAriaNovaCore } from './core/AriaNovaCore';

// ==================== AGENTS ====================

export { CoreAgent } from './agents/CoreAgent';
export { AlphaAgent } from './agents/AlphaAgent';
export { BetaAgent } from './agents/BetaAgent';
export { GammaAgent } from './agents/GammaAgent';
export { DeltaAgent } from './agents/DeltaAgent';
export { CreativityAgent } from './agents/CreativityAgent';
export { InterfaceAgent } from './agents/InterfaceAgent';
export { JowAgent } from './agents/JowAgent';

// ==================== SERVICES ====================

export { ResponseCache } from './services/ResponseCache';
export { ContextCompressor } from './services/ContextCompressor';
export { SmartSuggestions } from './services/SmartSuggestions';
export { VoiceCommands } from './services/VoiceCommands';
export { MultiModalProcessor } from './services/MultiModalProcessor';
export { HybridMemory } from './services/HybridMemory';

// ==================== PROVIDERS ====================

export { LlamaInferenceProvider } from './providers/inference/LlamaInferenceProvider';
export type {
  LlamaConfig,
  GenerateOptions,
  GenerateResult,
  ModelInfo,
} from './providers/inference/LlamaInferenceProvider';

// ==================== STORE (MONETIZATION) ====================

export {
  SubscriptionTier,
  SubscriptionFeatures,
  SUBSCRIPTION_TIERS,
  getSubscriptionFeatures,
  canAccess,
  getUpgradeDiscount,
} from './store/subscription/SubscriptionTiers';

export {
  ItemCategory,
  ItemRarity,
  ShopItem,
  SHOP_ITEMS,
  getItemsByCategory,
  getItemsByRarity,
  getFeaturedItems,
  getNewItems,
  getRarityColor,
  canPurchase,
} from './store/shop/ShopItems';

// ==================== ARIA AI ====================

export { SelfLearningModel } from './aria/ai/model/SelfLearningModel';
export { default as SelfAttentionEngine } from './aria/ai/attention/SelfAttentionEngine';
export { default as VectorStore } from './aria/ai/memory/VectorStore';

// ==================== MAIN CLASS ====================

/**
 * Main AI Library Class
 * 
 * @example
 * ```typescript
 * import { AriaNovaAI } from '@aria-nova/core';
 * 
 * const ai = new AriaNovaAI({
 *   cacheSize: 100,
 *   contextWindow: 4096,
 * });
 * 
 * await ai.initialize();
 * 
 * const response = await ai.think("Hello!");
 * console.log(response.text);
 * ```
 */
export class AriaNovaAI {
  private core: any;
  private config: AIConfig;
  public initialized: boolean = false;

  constructor(config: AIConfig = {}) {
    this.config = config;
    // Import dynamically to avoid circular deps
    const { createAriaNovaCore } = require('./core/AriaNovaCore');
    this.core = createAriaNovaCore(config);
  }

  /**
   * Initialize the AI system
   */
  async initialize(onProgress?: (progress: { stage: string; percent: number }) => void): Promise<void> {
    await this.core.initialize(onProgress);
    this.initialized = true;
  }

  /**
   * Process text input and get AI response
   */
  async think(input: string, options: ThinkOptions = {}): Promise<ThinkResponse> {
    if (!this.initialized) {
      throw new Error('AI not initialized. Call initialize() first.');
    }
    return await this.core.think(input, options);
  }

  /**
   * Get attention visualization data
   */
  getAttention(): { attention: AttentionWeight[]; confidence: number } {
    return this.core.getAttention();
  }

  /**
   * Get Jow's learning progress
   */
  getJowProgress(): JowStats {
    return this.core.getJowProgress();
  }

  /**
   * Get system status
   */
  getStatus(): EcosystemStatus {
    return this.core.getStatus();
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    await this.core.clearAll();
  }

  /**
   * Export all data
   */
  async exportData(): Promise<any> {
    return await this.core.exportData();
  }
}

// ==================== DEFAULT EXPORT ====================

export default AriaNovaAI;
