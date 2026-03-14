// src/providers/inference/LlamaInferenceProvider.ts
/**
 * Local LLM inference provider using llama.rn
 * Provides on-device AI inference with TinyLlama model
 */

import { initLlama, releaseAllLlama, LlamaContext } from 'llama.rn';
import * as FileSystem from 'expo-file-system';

export interface LlamaConfig {
  modelPath?: string;
  nPredict?: number;
  temperature?: number;
  nCtx?: number;
  nThreads?: number;
}

export interface GenerateOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface GenerateResult {
  text: string;
  usage: {
    outputTokens: number;
  };
  latency: number;
  tier: 'device';
}

export interface ModelInfo {
  name: string;
  size: string;
  quantization: string;
  loaded: boolean;
  path: string;
}

export class LlamaInferenceProvider {
  public name: string;
  public tier: string;
  private modelPath: string;
  private nPredict: number;
  private temperature: number;
  private nCtx: number;
  private nThreads: number;
  private context: any | null; // LlamaContext type
  private _isAvailable: boolean;

  constructor(config: LlamaConfig = {}) {
    this.name = 'llama-local';
    this.tier = 'device';
    this.modelPath = config.modelPath || `${FileSystem.documentDirectory}tinyllama-1.1b-chat-v1.0-q4_0.gguf`;
    this.nPredict = config.nPredict || 512;
    this.temperature = config.temperature || 0.7;
    this.nCtx = config.nCtx || 2048;
    this.nThreads = config.nThreads || 4;
    this.context = null;
    this._isAvailable = false;
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(): Promise<void> {
    if (this._isAvailable) return;

    try {
      const info = await FileSystem.getInfoAsync(this.modelPath);
      if (!info.exists) {
        throw new Error(`Model file not found: ${this.modelPath}`);
      }

      console.log('[LlamaProvider] Loading model:', this.modelPath);

      this.context = await initLlama({
        model: this.modelPath,
        n_ctx: this.nCtx,
        n_threads: this.nThreads,
        use_mlock: true,
        use_mmap: true,
      });

      this._isAvailable = true;
      console.log('[LlamaProvider] Initialized successfully');
    } catch (err) {
      console.error('[LlamaProvider] Initialization failed:', err);
      throw err;
    }
  }

  async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
    if (!this._isAvailable || !this.context) {
      throw new Error('[LlamaProvider] Not initialized');
    }

    const systemPrompt = options.systemPrompt || 'You are Aria-Nova, a helpful AI assistant.';
    const maxTokens = options.maxTokens || this.nPredict;
    const temperature = options.temperature || this.temperature;

    const formatted = this._formatPrompt(prompt, systemPrompt);
    const startTime = Date.now();

    try {
      const result = await this.context.completion({
        prompt: formatted,
        n_predict: maxTokens,
        temperature: temperature,
        top_p: options.topP || 0.9,
        stop: ['</s>', 'User:', '\n\n\n'],
      });

      const latency = Date.now() - startTime;

      return {
        text: this._cleanResponse(result.text),
        usage: {
          outputTokens: result.tokens_predicted || 0,
        },
        latency,
        tier: 'device',
      };
    } catch (err) {
      console.error('[LlamaProvider] Generation error:', err);
      throw err;
    }
  }

  async generateStream(
    prompt: string,
    options: GenerateOptions = {},
    onToken?: (token: string, fullText: string) => void
  ): Promise<GenerateResult> {
    if (!this._isAvailable || !this.context) {
      throw new Error('[LlamaProvider] Not initialized');
    }

    const systemPrompt = options.systemPrompt || 'You are Aria-Nova, a helpful AI assistant.';
    const maxTokens = options.maxTokens || this.nPredict;
    const temperature = options.temperature || this.temperature;

    const formatted = this._formatPrompt(prompt, systemPrompt);
    const startTime = Date.now();

    try {
      let fullText = '';

      const result = await this.context.completion(
        {
          prompt: formatted,
          n_predict: maxTokens,
          temperature: temperature,
          top_p: options.topP || 0.9,
          stop: ['</s>', 'User:', '\n\n\n'],
        },
        (data: any) => {
          const token = data.token;
          fullText += token;
          if (onToken) onToken(token, fullText);
        }
      );

      const latency = Date.now() - startTime;

      return {
        text: this._cleanResponse(fullText),
        usage: {
          outputTokens: result.tokens_predicted || 0,
        },
        latency,
        tier: 'device',
      };
    } catch (err) {
      console.error('[LlamaProvider] Stream error:', err);
      throw err;
    }
  }

  async dispose(): Promise<void> {
    if (this.context) {
      await releaseAllLlama();
      this.context = null;
      this._isAvailable = false;
      console.log('[LlamaProvider] Disposed');
    }
  }

  private _formatPrompt(userPrompt: string, systemPrompt: string): string {
    return `<|system|>\n${systemPrompt}</s>\n<|user|>\n${userPrompt}</s>\n<|assistant|>\n`;
  }

  private _cleanResponse(text: string): string {
    return text
      .replace(/<\|.*?\|>/g, '')
      .replace(/<\/s>/g, '')
      .replace(/User:.*$/s, '')
      .trim();
  }

  getInfo(): ModelInfo {
    return {
      name: 'TinyLlama-1.1B-Chat',
      size: '637 MB',
      quantization: 'Q4_0',
      loaded: this._isAvailable,
      path: this.modelPath,
    };
  }
}
