// src/agents/AlphaAgent.ts
/**
 * AlphaAgent: Media Capture & Selection Specialist
 * 
 * Clear Separation of Concerns:
 * - Media input: AlphaAgent (this file)
 * - Vision AI: VisionAgent (separate agent)
 * - Image processing: ImageProcessor (utility)
 * 
 * Responsibilities:
 * - Camera capture and gallery selection
 * - Media format conversions
 * - Image quality optimization
 * - Coordinate handoff to VisionAgent for AI processing
 * 
 * Agent Name: Alpha
 * Role: Media Input & Preparation
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export class AlphaAgent {
  private visionAgent: any = null;
  private _base64Cache: Map<string, string> = new Map();

  // Agent metadata
  private readonly agentName = 'Alpha';
  private readonly agentRole = 'Media Capture & Input Specialist';

  constructor(config: {
    visionAgent?: any;
  } = {}) {
    this.visionAgent = config.visionAgent || null;
  }

  /**
   * Select image from device gallery
   * Returns image asset with URI, dimensions, and metadata
   */
  async pickImage(options: {
    allowsEditing?: boolean;
    quality?: number;
  } = {}): Promise<any> {
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

  /**
   * Capture photo using device camera
   * Returns image asset with URI, dimensions, and metadata
   */
  async takePhoto(options: {
    allowsEditing?: boolean;
    quality?: number;
  } = {}): Promise<any> {
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
   * Analyze image using vision AI
   * 
   * DELEGATES to VisionAgent for actual computer vision
   * This is a convenience method for backward compatibility
   * 
   * @deprecated Use VisionAgent.describeImage() directly for better control
   */
  async analyzeImage(
    imageUri: string,
    prompt: string = 'Describe this image'
  ): Promise<{
    description: string;
    confidence: number;
    source: string;
  }> {
    // Delegate to VisionAgent if available
    if (this.visionAgent) {
      try {
        const result = await this.visionAgent.describeImage(imageUri, prompt);
        return {
          description: result.description,
          confidence: result.confidence,
          source: 'VisionAgent-Moondream',
        };
      } catch (error) {
        console.error('[AlphaAgent] VisionAgent failed:', error);
      }
    }

    // Fallback: No vision capability
    return {
      description: '[Vision not available - VisionAgent not initialized]',
      confidence: 0,
      source: 'none',
    };
  }

  /**
   * Convert image URI to base64
   * Cached for performance
   */
  async imageToBase64(imageUri: string): Promise<string> {
    if (this._base64Cache.has(imageUri)) {
      return this._base64Cache.get(imageUri)!;
    }

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // LRU cache with max 10 items
    if (this._base64Cache.size >= 10) {
      const firstKey = this._base64Cache.keys().next().value;
      this._base64Cache.delete(firstKey);
    }

    this._base64Cache.set(imageUri, base64);
    return base64;
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    role: string;
    hasVisionAgent: boolean;
    cacheSize: number;
  } {
    return {
      name: this.agentName,
      role: this.agentRole,
      hasVisionAgent: this.visionAgent !== null,
      cacheSize: this._base64Cache.size,
    };
  }

  /**
   * Clear base64 cache
   */
  clearCache(): void {
    this._base64Cache.clear();
    console.log('[AlphaAgent] Base64 cache cleared');
  }
}
