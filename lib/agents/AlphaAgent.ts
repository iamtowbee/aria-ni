// src/agents/AlphaAgent.js
// Vision agent - uses expo-image-picker + LlamaModel for descriptions

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export class AlphaAgent {
  constructor(config = {}) {
    this.llamaModel = config.llamaModel || null; // Shared with CoreAgent
    this._base64Cache = new Map();
  }

  async pickImage(options = {}) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('[AlphaAgent] Gallery permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      quality: options.quality ?? 0.7,
    });

    return result.canceled ? null : result.assets[0];
  }

  async takePhoto(options = {}) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('[AlphaAgent] Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options.allowsEditing ?? true,
      quality: options.quality ?? 0.7,
    });

    return result.canceled ? null : result.assets[0];
  }

  /**
   * Analyze image using local LLM.
   * Note: Without vision capabilities in the model, we generate
   * a description prompt and let the LLM create a plausible response.
   */
  async analyzeImage(imageUri, prompt = 'Describe this image') {
    if (!this.llamaModel || !this.llamaModel.isLoaded) {
      return {
        description: '[Vision not available - LLM not loaded]',
        confidence: 0,
      };
    }

    const base64 = await this.imageToBase64(imageUri);

    // Since TinyLlama doesn't have vision, we create a text prompt
    // In production, you'd use a vision-capable model or API here
    const visionPrompt = `I'm showing you an image. ${prompt}
    
Please provide a helpful response about what might be in the image based on the context of the conversation.`;

    try {
      const result = await this.llamaModel.generate(visionPrompt, {
        systemPrompt: 'You are a helpful assistant. When discussing images, be creative but acknowledge you cannot actually see images.',
        maxTokens: 150,
      });

      return {
        description: result.text,
        base64,
        mediaType: 'image/jpeg',
        source: 'llama-text-based',
        confidence: 0.5,
      };
    } catch (err) {
      console.error('[AlphaAgent] Analysis error:', err);
      return {
        description: 'Unable to analyze image at the moment.',
        error: err.message,
      };
    }
  }

  async imageToBase64(imageUri) {
    if (this._base64Cache.has(imageUri)) {
      return this._base64Cache.get(imageUri);
    }

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (this._base64Cache.size >= 10) {
      const firstKey = this._base64Cache.keys().next().value;
      this._base64Cache.delete(firstKey);
    }

    this._base64Cache.set(imageUri, base64);
    return base64;
  }
}
