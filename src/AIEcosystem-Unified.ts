// src/AIEcosystem-Unified.js
/**
 * UNIFIED Nova AI Ecosystem
 * 
 * Integrates ALL phases:
 * - Phase 1: Foundation (Response Caching, Basic Agents)
 * - Phase 2: Intelligence (Context Compression, Agent Bus, Smart Suggestions, Multi-Modal)
 * - Phase 3: Polish (Animated Avatar, Voice Commands, Split-Screen, Data Viz)
 * 
 * Single unified system with all features working together
 */

import { ResponseCache } from './services/ResponseCache';
import { ContextCompressor } from './services/ContextCompressor';
import { AgentBus, AgentEvents } from './core/events/AgentBus';
import { SmartSuggestions } from './services/SmartSuggestions';
import { MultiModalProcessor } from './services/MultiModalProcessor';
import { VoiceCommands } from './services/VoiceCommands';

import { CoreAgent } from './agents/CoreAgent';
import { AlphaAgent } from './agents/AlphaAgent';
import { BetaAgent } from './agents/BetaAgent';
import { GammaAgent } from './agents/GammaAgent';
import { DeltaAgent } from './agents/DeltaAgent';
import { CreativityAgent } from './agents/CreativityAgent';
import { InterfaceAgent } from './agents/InterfaceAgent';

export class UnifiedAIEcosystem {
  constructor(config = {}) {
    // Phase 1: Foundation
    this.cache = new ResponseCache({
      maxCacheSize: config.cacheSize || 100,
      similarityThreshold: config.cacheSimilarity || 0.92,
    });

    // Phase 2: Intelligence
    this.bus = new AgentBus();
    this.compressor = new ContextCompressor({
      maxTokens: config.maxTokens || 2048,
      recentMessageCount: config.recentMessages || 10,
    });
    this.suggestions = new SmartSuggestions({
      maxSuggestions: config.maxSuggestions || 3,
    });

    // Initialize model wrapper (placeholder - replace with actual LLM)
    this.model = {
      isLoaded: () => true,
      generate: async (prompt, options) => {
        // Placeholder - integrate actual LLM here
        return {
          text: 'Response from LLM',
          usage: { outputTokens: 50 },
          latency: 100,
        };
      },
      generateStream: async (prompt, options, onToken) => {
        // Placeholder streaming
        const text = 'Streaming response';
        if (onToken) {
          for (const char of text) {
            onToken(char, text.substring(0, text.indexOf(char) + 1));
            await new Promise(r => setTimeout(r, 50));
          }
        }
        return { text, latency: 100 };
      },
      getInfo: () => ({
        name: 'Local LLM',
        loaded: true,
      }),
    };

    // Initialize all 7 agents
    this.core = new CoreAgent({
      sharedModel: this.model,
      personality: config.personality,
      maxHistoryLength: config.maxHistoryLength || 6,
    });

    this.alpha = new AlphaAgent({
      llamaModel: this.model,
    });

    this.beta = new BetaAgent({
      language: config.language || 'en-US',
      voice: config.voice,
    });

    this.gamma = new GammaAgent({
      storageKey: config.memoryKey || '@ai_memory_unified',
      maxShortTerm: config.maxShortTerm || 50,
      maxLongTerm: config.maxLongTerm || 500,
    });

    // Use enhanced DeltaAgent with event bus
    this.delta = new DeltaAgent({
      smoothingFactor: config.emotionSmoothing || 0.4,
      bus: this.bus, // Pass bus for event emission
    });

    this.creativity = new CreativityAgent({
      sharedModel: this.model,
      persona: config.personality?.name || 'Nova',
      style: config.creativeStyle,
    });

    this.interface = new InterfaceAgent({
      theme: config.theme || 'DEFAULT',
      onStateChange: config.onUIStateChange,
      onThemeChange: config.onThemeChange,
      onNotification: config.onNotification,
    });

    // Phase 2 & 3: Additional processors
    this.multiModal = new MultiModalProcessor(this);
    this.voiceCommands = new VoiceCommands(this);

    this.config = config;
    this.initialized = false;

    // Setup agent communication (Phase 2)
    this._setupAgentCommunication();
  }

  /**
   * Initialize the entire ecosystem
   */
  async initialize(onProgress = null) {
    if (this.initialized) return;

    try {
      // 1. Load cache
      if (onProgress) onProgress({ stage: 'cache', percent: 10 });
      await this.cache.initialize();

      // 2. Load context compressor
      if (onProgress) onProgress({ stage: 'context', percent: 20 });
      await this.compressor.initialize();

      // 3. Initialize agents
      if (onProgress) onProgress({ stage: 'agents', percent: 50 });
      await this.core.load();
      await this.gamma.initialize();

      // 4. Activate interface
      if (onProgress) onProgress({ stage: 'interface', percent: 80 });
      ['core', 'alpha', 'beta', 'gamma', 'delta', 'creativity', 'interface'].forEach(id =>
        this.interface.activateCreature(id)
      );

      this.interface.startGlowAnimation();

      if (onProgress) onProgress({ stage: 'complete', percent: 100 });
      this.initialized = true;

      console.log('[UnifiedEcosystem] Initialized with all phases:');
      console.log('  ✓ Phase 1: Response Cache');
      console.log('  ✓ Phase 2: Context, Agent Bus, Suggestions, Multi-Modal');
      console.log('  ✓ Phase 3: Voice Commands, Animations');
    } catch (err) {
      console.error('[UnifiedEcosystem] Initialization failed:', err);
      throw err;
    }
  }

  /**
   * Process text with ALL features
   */
  async processText(text, options = {}) {
    if (!this.initialized) {
      throw new Error('[UnifiedEcosystem] Not initialized');
    }

    try {
      // Phase 1: Check cache
      const cached = await this.cache.get(text);
      if (cached && !options.skipCache) {
        console.log('[UnifiedEcosystem] ⚡ Cache hit');
        return {
          ...cached,
          cached: true,
          suggestions: await this._getSuggestions(text, cached.response),
        };
      }

      // Phase 2: Emotion analysis + event emission
      const emotionResult = this.delta.analyse(text);
      this.interface.applyEmotion(emotionResult);

      // Phase 2: Context compression
      const conversationHistory = this.core.conversationHistory || [];
      const compressed = await this.compressor.compress(conversationHistory);

      // Phase 2: Memory recall
      await this.gamma.store({
        content: text,
        type: 'user_input',
        importance: 0.5,
      });

      const memories = await this.gamma.recall(text, {
        limit: 4,
        recencyWeight: 0.4,
      });

      // Phase 2: RAG expansion
      const ragContext = await this.compressor.expandContext(text, 3);

      // Generate response
      this.interface.setAvatarState('THINKING');

      const response = await this.core.reason({
        text,
        context: { memories, ragContext: ragContext.contextText },
        emotionContext: this.delta.getCoreContext(),
        onStream: options.onStream,
      });

      // Phase 1: Cache response
      await this.cache.set(text, response.text, {
        emotion: emotionResult.emotion.id,
      });

      // Store response
      await this.gamma.store({
        content: response.text,
        type: 'assistant_response',
        importance: 0.6,
      });

      // Phase 2: Get smart suggestions
      const suggestions = await this._getSuggestions(text, response.text);

      // Speak if enabled
      if (this.config.autoSpeak && options.speak !== false) {
        await this._speak(response.text);
      }

      this.interface.setAvatarState('IDLE');

      return {
        ...response,
        emotionResult,
        cached: false,
        suggestions,
        cacheStats: this.cache.getStats(),
      };
    } catch (err) {
      console.error('[UnifiedEcosystem] processText error:', err);
      this.interface.setAvatarState('ERROR');
      throw err;
    }
  }

  /**
   * Process multi-modal message (Phase 2)
   */
  async processMultiModal(message, options = {}) {
    return this.multiModal.process(message, options);
  }

  /**
   * Start voice commands (Phase 3)
   */
  async startVoiceCommands() {
    return this.voiceCommands.startWakeWordDetection();
  }

  /**
   * Stop voice commands
   */
  async stopVoiceCommands() {
    return this.voiceCommands.stop();
  }

  /**
   * Get smart suggestions (Phase 2)
   */
  async getSuggestions(context = {}) {
    return this.suggestions.getSuggestions(context);
  }

  /**
   * Get cache statistics (Phase 1)
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get compression statistics (Phase 2)
   */
  getCompressionStats() {
    return this.compressor.getStats();
  }

  /**
   * Get complete system status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      model: this.model.getInfo(),
      
      // Phase 1
      cache: this.cache.getStats(),
      
      // Phase 2
      compression: this.compressor.getStats(),
      suggestions: this.suggestions.getStats(),
      
      // All agents
      avatarState: this.interface.currentAvatarState.id,
      currentTheme: this.interface.currentTheme.id,
      currentEmotion: this.delta.currentEmotion.id,
      activeCreatures: this.interface.getActiveCreatures(),
      
      agents: {
        core: { active: true, ready: this.core.isReady },
        alpha: { active: true },
        beta: { active: true, speaking: this.beta.isSpeaking },
        gamma: { active: this.gamma.initialized },
        delta: { active: true, emotion: this.delta.currentEmotion.id },
        creativity: { active: true },
        interface: { active: true, theme: this.interface.currentTheme.id },
      },
    };
  }

  /**
   * Clear all data
   */
  async clearAll() {
    await this.cache.clear();
    await this.gamma.clearAllMemories();
    await this.compressor.clear();
    this.suggestions.clear();
    this.core.clearHistory();
    this.delta.reset();
  }

  /**
   * Export all data
   */
  async exportData() {
    return {
      memories: await this.gamma.exportMemories(),
      cacheStats: this.cache.getStats(),
      suggestionStats: this.suggestions.getStats(),
      emotionHistory: this.delta.getEmotionHistory(),
    };
  }

  /**
   * Setup agent communication (Phase 2)
   */
  _setupAgentCommunication() {
    // DeltaAgent → BetaAgent (emotion changes voice)
    this.bus.on(AgentEvents.EMOTION_CHANGED, async (payload) => {
      if (payload.emotion === 'stressed' || payload.emotion === 'anxious') {
        // Adjust voice to be calmer
        this.beta.pitch = 0.9;
        this.beta.rate = 0.85;
      } else if (payload.emotion === 'excited' || payload.emotion === 'happy') {
        // Adjust voice to be more energetic
        this.beta.pitch = 1.1;
        this.beta.rate = 1.1;
      }
    });

    // DeltaAgent → InterfaceAgent (emotion changes UI)
    this.bus.on(AgentEvents.EMOTION_CHANGED, async (payload) => {
      // Avatar color changes handled by InterfaceAgent
    });

    // High emotion intensity → notify user
    this.bus.on(AgentEvents.EMOTION_INTENSITY_HIGH, async (payload) => {
      console.log(`[UnifiedEcosystem] High ${payload.emotion} intensity detected`);
    });
  }

  /**
   * Get smart suggestions based on context
   */
  async _getSuggestions(userMessage, aiResponse) {
    return this.suggestions.getSuggestions({
      lastMessage: userMessage,
      lastResponse: aiResponse,
      usedVoice: this.beta.isSpeaking,
      usedImage: false, // Track this in actual usage
      usedCreative: false,
    });
  }

  /**
   * Speak text
   */
  async _speak(text) {
    this.interface.setAvatarState('SPEAKING');
    try {
      await this.beta.speakInChunks(text);
    } finally {
      this.interface.setAvatarState('IDLE');
    }
  }
}

/**
 * Factory function
 */
export const createUnifiedEcosystem = (config) => new UnifiedAIEcosystem(config);

/**
 * Usage:
 * 
 * const ecosystem = createUnifiedEcosystem({
 *   // Phase 1
 *   cacheSize: 100,
 *   
 *   // Phase 2
 *   maxTokens: 2048,
 *   recentMessages: 10,
 *   maxSuggestions: 3,
 *   
 *   // General
 *   personality: { name: 'Nova', traits: ['helpful'] },
 *   autoSpeak: false,
 * });
 * 
 * await ecosystem.initialize();
 * 
 * // Use all features
 * const response = await ecosystem.processText("Hello!");
 * const suggestions = response.suggestions;
 * 
 * await ecosystem.startVoiceCommands();
 */

// CommonJS exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UnifiedAIEcosystem, createUnifiedEcosystem };
}
