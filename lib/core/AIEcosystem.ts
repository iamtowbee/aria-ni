// src/AIEcosystem.js
// Main orchestrator for 7-agent system with local LLM

import { LlamaModel } from '../services/LlamaModel';
import { CoreAgent } from './agents/CoreAgent';
import { AlphaAgent } from './agents/AlphaAgent';
import { BetaAgent } from './agents/BetaAgent';
import { GammaAgent } from './agents/GammaAgent';
import { DeltaAgent } from './agents/DeltaAgent';
import { CreativityAgent } from './agents/CreativityAgent';
import { InterfaceAgent } from './agents/InterfaceAgent';

export class AIEcosystem {
  constructor(config = {}) {
    // Initialize inference provider
    this.modelAdapter = new LlamaModel({
      modelPath: config.modelPath,
      nPredict: config.nPredict || 512,
      temperature: config.temperature || 0.7,
      nCtx: config.nCtx || 2048,
      nThreads: config.nThreads || 4,
    });

    // Create adapter that matches old LlamaModel interface
    const modelAdapter = {
      load: async (onProgress) => {
        await this.inferenceProvider.initialize();
      },
      generate: async (prompt, options) => {
        return this.inferenceProvider.generate(prompt, options);
      },
      generateStream: async (prompt, options, onToken) => {
        return this.inferenceProvider.generateStream(prompt, options, onToken);
      },
      isLoaded: this.inferenceProvider.isAvailable,
      getInfo: () => this.inferenceProvider.getInfo(),
    };

    // Initialize all agents with model adapter
    this.core = new CoreAgent({
      sharedModel: modelAdapter,
      personality: config.personality,
      maxHistoryLength: config.maxHistoryLength || 6,
    });

    this.alpha = new AlphaAgent({
      llamaModel: modelAdapter,
    });

    this.beta = new BetaAgent({
      language: config.language || 'en-US',
      voice: config.voice,
    });

    this.gamma = new GammaAgent({
      storageKey: config.memoryKey || '@ai_memory_v2',
      maxShortTerm: config.maxShortTerm || 50,
      maxLongTerm: config.maxLongTerm || 500,
    });

    this.delta = new DeltaAgent({
      smoothingFactor: config.emotionSmoothing || 0.4,
    });

    this.creativity = new CreativityAgent({
      sharedModel: modelAdapter,
      persona: config.personality?.name || 'Nova',
      style: config.creativeStyle,
    });

    this.interface = new InterfaceAgent({
      theme: config.theme || 'DEFAULT',
      onStateChange: config.onUIStateChange,
      onThemeChange: config.onThemeChange,
      onNotification: config.onNotification,
    });

    this.config = config;
    this.initialized = false;
  }

  async initialize(onProgress = null) {
    if (this.initialized) return;

    try {
      // Load LLM model (this is the heavy operation)
      if (onProgress) onProgress({ stage: 'model', percent: 0 });
      await this.inferenceProvider.initialize();

      // Load CoreAgent
      if (onProgress) onProgress({ stage: 'core', percent: 100 });
      await this.core.load();

      // Initialize GammaAgent (memory)
      if (onProgress) onProgress({ stage: 'memory', percent: 100 });
      await this.gamma.initialize();

      // Activate all creature companions
      ['core', 'alpha', 'beta', 'gamma', 'delta', 'creativity', 'interface'].forEach(id =>
        this.interface.activateCreature(id)
      );

      this.interface.startGlowAnimation();
      this.initialized = true;

      console.log('[AIEcosystem] Initialized successfully');
    } catch (err) {
      console.error('[AIEcosystem] Initialization failed:', err);
      throw err;
    }
  }

  async processText(text, options = {}) {
    if (!this.initialized) {
      throw new Error('[AIEcosystem] Not initialized. Call initialize() first.');
    }

    try {
      // 1. Emotion analysis (local, instant)
      const emotionResult = this.delta.analyse(text);
      this.interface.applyEmotion(emotionResult);
      this.interface.animateCreature('delta', 'bounce');

      // 2. Store user input in memory
      await this.gamma.store({
        content: text,
        type: 'user_input',
        importance: 0.5,
      });

      // 3. Recall relevant memories
      const memories = await this.gamma.recall(text, {
        limit: 4,
        recencyWeight: 0.4,
      });

      // 4. Check if creative request
      const creativeMode = this._detectCreativeMode(text);
      if (creativeMode) {
        return this._handleCreative(text, creativeMode, memories, emotionResult, options);
      }

      // 5. Process through CoreAgent
      this.interface.setAvatarState('THINKING');
      this.interface.animateCreature('core', 'spin');

      const response = await this.core.reason({
        text,
        context: { memories },
        emotionContext: this.delta.getCoreContext(),
        onStream: options.onStream,
      });

      // 6. Store response
      await this.gamma.store({
        content: response.text,
        type: 'assistant_response',
        importance: 0.6,
        context: { userQuery: text },
      });

      // 7. Speak if enabled
      if (this.config.autoSpeak && options.speak !== false) {
        await this._speak(response.text);
      }

      this.interface.setAvatarState('IDLE');

      return { ...response, emotionResult };
    } catch (err) {
      console.error('[AIEcosystem] processText error:', err);
      this.interface.setAvatarState('ERROR');
      throw err;
    }
  }

  async processImage(imageUri, prompt, options = {}) {
    if (!this.initialized) {
      throw new Error('[AIEcosystem] Not initialized');
    }

    this.interface.setAvatarState('PROCESSING');
    this.interface.animateCreature('alpha', 'bounce');

    try {
      const visionResult = await this.alpha.analyzeImage(imageUri, prompt);

      await this.gamma.store({
        content: visionResult.description,
        type: 'vision_analysis',
        importance: 0.7,
      });

      if (this.config.autoSpeak && options.speak !== false) {
        await this._speak(visionResult.description);
      }

      this.interface.setAvatarState('IDLE');

      return {
        text: visionResult.description,
        visionAnalysis: visionResult,
      };
    } catch (err) {
      console.error('[AIEcosystem] processImage error:', err);
      this.interface.setAvatarState('ERROR');
      throw err;
    }
  }

  async generateCreative(prompt, mode = 'STORY', options = {}) {
    if (!this.initialized) {
      throw new Error('[AIEcosystem] Not initialized');
    }

    this.interface.setAvatarState('CREATIVE');
    this.interface.animateCreature('creativity', 'sparkle');

    try {
      const result = await this.creativity.generate(prompt, mode, options);

      await this.gamma.store({
        content: result.text,
        type: 'creative_output',
        importance: 0.75,
        tags: [mode.toLowerCase()],
      });

      if (this.config.autoSpeak && options.speak !== false) {
        await this._speak(result.text);
      }

      this.interface.setAvatarState('IDLE');
      return result;
    } catch (err) {
      console.error('[AIEcosystem] generateCreative error:', err);
      this.interface.setAvatarState('ERROR');
      throw err;
    }
  }

  async startListening() {
    this.interface.setAvatarState('LISTENING');
    this.interface.startGlowAnimation();

    return this.beta.startListening({
      onResult: async (transcript, isFinal) => {
        if (isFinal && transcript) {
          await this.stopListening();
          return this.processText(transcript, { speak: true });
        }
      },
      onEnd: () => this.interface.setAvatarState('IDLE'),
    });
  }

  async stopListening() {
    await this.beta.stopListening();
    this.interface.setAvatarState('IDLE');
    this.interface.stopGlowAnimation();
  }

  async speak(text) {
    return this._speak(text);
  }

  async stopSpeaking() {
    return this.beta.stop();
  }

  async pickAndAnalyzeImage(prompt) {
    const image = await this.alpha.pickImage();
    return image ? this.processImage(image.uri, prompt) : null;
  }

  async takePhotoAndAnalyze(prompt) {
    const photo = await this.alpha.takePhoto();
    return photo ? this.processImage(photo.uri, prompt) : null;
  }

  async getRecentMemories(n = 10) {
    return this.gamma.getRecentMemories(n);
  }

  async getMemoryStats() {
    return this.gamma.getMemoryStats();
  }

  async exportMemories() {
    return this.gamma.exportMemories();
  }

  async clearMemories() {
    await this.gamma.clearAllMemories();
    this.core.clearHistory();
    this.delta.reset();
  }

  setTheme(themeId) {
    return this.interface.setTheme(themeId);
  }

  notify(message, type = 'info') {
    this.interface.notify(message, type);
  }

  getStatus() {
    return {
      initialized: this.initialized,
      model: this.inferenceProvider.getInfo(),
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

  async _speak(text) {
    this.interface.setAvatarState('SPEAKING');
    this.interface.animateCreature('beta', 'bounce');
    try {
      await this.beta.speakInChunks(text);
    } finally {
      this.interface.setAvatarState('IDLE');
    }
  }

  _detectCreativeMode(text) {
    const t = text.toLowerCase();
    if (/\b(write|tell).+(story|tale|fiction)\b/.test(t)) return 'STORY';
    if (/\bwrite.+(poem|haiku|limerick)\b/.test(t)) return 'POEM';
    if (/\bbrainstorm|ideas? for|give me ideas\b/.test(t)) return 'BRAINSTORM';
    if (/\bwrite.+dialogue|conversation between\b/.test(t)) return 'DIALOGUE';
    if (/\bdescribe|paint a picture of\b/.test(t)) return 'DESCRIPTION';
    return null;
  }

  async _handleCreative(text, mode, memories, emotionResult, options) {
    this.interface.setAvatarState('CREATIVE');
    const ctx = memories.map(m => m.content).join('. ');
    const enriched = ctx ? `${text}\n\nContext: ${ctx}` : text;

    const result = await this.creativity.generate(enriched, mode, {
      emotionContext: emotionResult,
      onStream: options.onStream,
    });

    await this.gamma.store({
      content: result.text,
      type: 'creative_output',
      importance: 0.75,
      tags: [mode.toLowerCase()],
    });

    if (this.config.autoSpeak && options.speak !== false) {
      await this._speak(result.text);
    }

    this.interface.setAvatarState('IDLE');
    return { ...result, emotionResult };
  }
}

export const createAIEcosystem = (config) => new AIEcosystem(config);
