// src/utils/ImageProcessor.ts
/**
 * Image Processor Utility
 * 
 * Separation of Concerns:
 * - Image preprocessing and transformations
 * - Format conversions (URI, base64, tensor)
 * - Image quality optimization
 * 
 * Used by: VisionAgent, AlphaAgent
 */

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface ImageProcessingOptions {
  resize?: { width: number; height: number };
  quality?: number;
  format?: 'jpeg' | 'png';
  normalize?: boolean;
}

export interface ProcessedImage {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * ImageProcessor
 * 
 * Handles all image preprocessing, optimization, and format conversions
 * Separate from agent logic and model inference
 */
export class ImageProcessor {
  private cache: Map<string, ProcessedImage> = new Map();
  private readonly MAX_CACHE_SIZE = 50;

  /**
   * Process image with specified options
   */
  async processImage(
    imageUri: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const cacheKey = this.getCacheKey(imageUri, options);

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('[ImageProcessor] Using cached processed image');
      return this.cache.get(cacheKey)!;
    }

    try {
      let processedUri = imageUri;

      // Apply transformations if needed
      if (options.resize || options.quality || options.format) {
        const manipulateOptions = [];

        if (options.resize) {
          manipulateOptions.push({
            resize: options.resize,
          });
        }

        const result = await manipulateAsync(
          imageUri,
          manipulateOptions,
          {
            compress: options.quality || 0.8,
            format: options.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG,
          }
        );

        processedUri = result.uri;
      }

      // Get image info
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      
      // Convert to base64 if needed
      let base64: string | undefined;
      if (options.normalize) {
        base64 = await FileSystem.readAsStringAsync(processedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const processed: ProcessedImage = {
        uri: processedUri,
        base64,
        width: options.resize?.width || 0,
        height: options.resize?.height || 0,
        format: options.format || 'jpeg',
        size: fileInfo.size || 0,
      };

      // Cache result
      this.addToCache(cacheKey, processed);

      return processed;

    } catch (error) {
      console.error('[ImageProcessor] Processing failed:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Resize image to specific dimensions
   */
  async resizeImage(
    imageUri: string,
    width: number,
    height: number
  ): Promise<string> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width, height } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      
      return result.uri;
    } catch (error) {
      throw new Error(`Image resize failed: ${error.message}`);
    }
  }

  /**
   * Convert image to base64
   */
  async imageToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return base64;
    } catch (error) {
      throw new Error(`Base64 conversion failed: ${error.message}`);
    }
  }

  /**
   * Optimize image for vision model input
   * Standard preprocessing for vision models
   */
  async optimizeForVision(
    imageUri: string,
    targetSize: number = 378 // Moondream's input size
  ): Promise<ProcessedImage> {
    return this.processImage(imageUri, {
      resize: { width: targetSize, height: targetSize },
      quality: 0.85,
      format: 'jpeg',
      normalize: true,
    });
  }

  /**
   * Get image dimensions without loading full image
   */
  async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    try {
      // In production, use proper image info extraction
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      // For now, return default dimensions
      return { width: 0, height: 0 };
    } catch (error) {
      throw new Error(`Failed to get image dimensions: ${error.message}`);
    }
  }

  /**
   * Compress image to reduce size
   */
  async compressImage(
    imageUri: string,
    quality: number = 0.7
  ): Promise<string> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [],
        { compress: quality, format: SaveFormat.JPEG }
      );
      
      return result.uri;
    } catch (error) {
      throw new Error(`Image compression failed: ${error.message}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[ImageProcessor] Cache cleared');
  }

  /**
   * Get cache key for image + options
   */
  private getCacheKey(imageUri: string, options: ImageProcessingOptions): string {
    return `${imageUri}:${JSON.stringify(options)}`;
  }

  /**
   * Add to cache with size limit
   */
  private addToCache(key: string, image: ProcessedImage): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, image);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0, // Would track hits/misses in production
    };
  }
}

// Singleton instance
export const imageProcessor = new ImageProcessor();
