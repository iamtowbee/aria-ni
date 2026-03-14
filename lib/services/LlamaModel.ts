// src/models/LlamaModel.js
// Wrapper around @mybigday/llama.rn for on-device inference
// Handles model loading, prompt formatting, and generation

import { initLlama, releaseAllLlama } from '@mybigday/llama.rn';
import * as FileSystem from 'expo-file-system';

export class LlamaModel {
  constructor(config = {}) {
    this.modelPath = config.modelPath || `${FileSystem.documentDirectory}tinyllama-1.1b-chat-v1.0-q4_0.gguf`;
    this.nPredict = config.nPredict || 512;
    this.temperature = config.temperature || 0.7;
    this.nCtx = config.nCtx || 2048;
    this.nThreads = config.nThreads || 4;
    this.context = null;
    this.isLoaded = false;
  }

  /**
   * Load model into memory.
   * @param {function} onProgress - Progress callback (0-100)
   */
  async load(onProgress = null) {
    if (this.isLoaded) return true;

    try {
      // Check if model file exists
      const info = await FileSystem.getInfoAsync(this.modelPath);
      if (!info.exists) {
        throw new Error(`Model file not found: ${this.modelPath}`);
      }

      if (onProgress) onProgress(20);

      console.log('[LlamaModel] Loading model:', this.modelPath);

      // Initialize llama.rn context
      this.context = await initLlama({
        model: this.modelPath,
        n_ctx: this.nCtx,
        n_threads: this.nThreads,
        use_mlock: true,
        use_mmap: true,
      });

      if (onProgress) onProgress(90);

      this.isLoaded = true;
      console.log('[LlamaModel] Model loaded successfully');

      if (onProgress) onProgress(100);
      return true;
    } catch (err) {
      console.error('[LlamaModel] Load failed:', err);
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Generate text completion.
   * @param {string} prompt - User prompt
   * @param {object} options - { systemPrompt, maxTokens, temperature }
   */
  async generate(prompt, options = {}) {
    if (!this.isLoaded || !this.context) {
      throw new Error('[LlamaModel] Model not loaded. Call load() first.');
    }

    const systemPrompt = options.systemPrompt || 'You are Nova, a helpful AI assistant.';
    const maxTokens = options.maxTokens || this.nPredict;
    const temperature = options.temperature || this.temperature;

    // Format for TinyLlama Chat
    const formatted = this._formatPrompt(prompt, systemPrompt);

    try {
      const startTime = Date.now();

      const result = await this.context.completion(
        {
          prompt: formatted,
          n_predict: maxTokens,
          temperature: temperature,
          top_p: 0.9,
          stop: ['</s>', 'User:', '\n\n\n'],
        },
        (data) => {
          // Optional: per-token callback
        }
      );

      const latency = Date.now() - startTime;

      return {
        text: this._cleanResponse(result.text),
        tokensGenerated: result.tokens_predicted || 0,
        latency,
        stopReason: result.stop_reason || 'length',
      };
    } catch (err) {
      console.error('[LlamaModel] Generation error:', err);
      throw new Error(`Generation failed: ${err.message}`);
    }
  }

  /**
   * Generate with streaming (per-token callback).
   * @param {string} prompt
   * @param {object} options
   * @param {function} onToken - Called with each token
   */
  async generateStream(prompt, options = {}, onToken) {
    if (!this.isLoaded || !this.context) {
      throw new Error('[LlamaModel] Model not loaded. Call load() first.');
    }

    const systemPrompt = options.systemPrompt || 'You are Nova, a helpful AI assistant.';
    const maxTokens = options.maxTokens || this.nPredict;
    const temperature = options.temperature || this.temperature;

    const formatted = this._formatPrompt(prompt, systemPrompt);

    try {
      let fullText = '';

      const result = await this.context.completion(
        {
          prompt: formatted,
          n_predict: maxTokens,
          temperature: temperature,
          top_p: 0.9,
          stop: ['</s>', 'User:', '\n\n\n'],
        },
        (data) => {
          const token = data.token;
          fullText += token;
          if (onToken) onToken(token, fullText);
        }
      );

      return {
        text: this._cleanResponse(fullText),
        tokensGenerated: result.tokens_predicted || 0,
      };
    } catch (err) {
      console.error('[LlamaModel] Stream error:', err);
      throw new Error(`Streaming failed: ${err.message}`);
    }
  }

  /**
   * Unload model from memory.
   */
  async unload() {
    if (this.context) {
      await releaseAllLlama();
      this.context = null;
      this.isLoaded = false;
      console.log('[LlamaModel] Model unloaded');
    }
  }

  /**
   * Format prompt for TinyLlama Chat template.
   */
  _formatPrompt(userPrompt, systemPrompt) {
    return `<|system|>
${systemPrompt}</s>
<|user|>
${userPrompt}</s>
<|assistant|>
`;
  }

  /**
   * Clean model response (remove special tokens, extra whitespace).
   */
  _cleanResponse(text) {
    return text
      .replace(/<\|.*?\|>/g, '') // Remove special tokens
      .replace(/<\/s>/g, '')
      .replace(/User:.*$/s, '')  // Remove any user prefix if model continues
      .trim();
  }

  /**
   * Get model info for UI display.
   */
  getInfo() {
    return {
      name: 'TinyLlama-1.1B-Chat',
      size: '637 MB',
      quantization: 'Q4_0',
      loaded: this.isLoaded,
      path: this.modelPath,
    };
  }
}
