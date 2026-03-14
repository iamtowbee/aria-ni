// src/utils/VideoFrameExtractor.ts
/**
 * Video Frame Extractor
 * 
 * Separation of Concerns:
 * - Video frame extraction: VideoFrameExtractor (this file)
 * - Frame analysis: VisionAgent
 * - Video capture: AlphaAgent
 * 
 * Responsibilities:
 * - Extract frames from video at intervals
 * - Generate video thumbnails
 * - Support batch frame extraction
 * - Handle video preprocessing
 */

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface VideoFrame {
  uri: string;
  timestamp: number; // milliseconds
  frameNumber: number;
}

export interface VideoFrameOptions {
  interval?: number; // Extract frame every N seconds
  maxFrames?: number; // Maximum frames to extract
  quality?: number;
  resize?: { width: number; height: number };
}

/**
 * VideoFrameExtractor
 * 
 * Utility for extracting frames from videos for vision analysis
 */
export class VideoFrameExtractor {
  private cache: Map<string, VideoFrame[]> = new Map();
  private readonly MAX_CACHE_SIZE = 10;

  /**
   * Extract frames from video at regular intervals
   */
  async extractFrames(
    videoUri: string,
    options: VideoFrameOptions = {}
  ): Promise<VideoFrame[]> {
    const {
      interval = 1, // 1 second
      maxFrames = 30,
      quality = 0.8,
      resize,
    } = options;

    try {
      console.log('[VideoFrameExtractor] Extracting frames from video...');

      // Check cache
      const cacheKey = `${videoUri}:${interval}:${maxFrames}`;
      if (this.cache.has(cacheKey)) {
        console.log('[VideoFrameExtractor] Using cached frames');
        return this.cache.get(cacheKey)!;
      }

      // In production, use a video processing library like ffmpeg or expo-av
      // For now, simulate frame extraction
      const frames: VideoFrame[] = [];
      const simulatedDuration = 10; // 10 seconds
      const frameCount = Math.min(
        Math.floor(simulatedDuration / interval),
        maxFrames
      );

      for (let i = 0; i < frameCount; i++) {
        const timestamp = i * interval * 1000;
        
        // In production, extract actual frame at this timestamp
        // For now, create placeholder
        frames.push({
          uri: `${videoUri}_frame_${i}.jpg`,
          timestamp,
          frameNumber: i,
        });
      }

      // Cache result
      this.addToCache(cacheKey, frames);

      console.log(`[VideoFrameExtractor] Extracted ${frames.length} frames`);
      return frames;

    } catch (error) {
      console.error('[VideoFrameExtractor] Frame extraction failed:', error);
      throw new Error(`Frame extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract a single frame at specific timestamp
   */
  async extractFrameAt(
    videoUri: string,
    timestamp: number // milliseconds
  ): Promise<VideoFrame> {
    try {
      console.log(`[VideoFrameExtractor] Extracting frame at ${timestamp}ms`);

      // In production, extract frame at exact timestamp
      const frame: VideoFrame = {
        uri: `${videoUri}_frame_${timestamp}.jpg`,
        timestamp,
        frameNumber: Math.floor(timestamp / 1000),
      };

      return frame;

    } catch (error) {
      throw new Error(`Frame extraction failed: ${error.message}`);
    }
  }

  /**
   * Generate video thumbnail
   */
  async generateThumbnail(
    videoUri: string,
    options: {
      timestamp?: number;
      width?: number;
      height?: number;
    } = {}
  ): Promise<string> {
    try {
      const {
        timestamp = 0, // First frame
        width = 320,
        height = 180,
      } = options;

      console.log('[VideoFrameExtractor] Generating thumbnail...');

      // Extract frame at timestamp
      const frame = await this.extractFrameAt(videoUri, timestamp);

      // Resize for thumbnail
      // In production, use actual frame URI
      const thumbnailUri = `${videoUri}_thumbnail.jpg`;

      return thumbnailUri;

    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Get video duration (helper)
   */
  async getVideoDuration(videoUri: string): Promise<number> {
    try {
      // In production, use expo-av or similar to get actual duration
      // For now, return simulated duration
      return 10000; // 10 seconds in milliseconds

    } catch (error) {
      throw new Error(`Failed to get video duration: ${error.message}`);
    }
  }

  /**
   * Clear frame cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[VideoFrameExtractor] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }

  private addToCache(key: string, frames: VideoFrame[]): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, frames);
  }
}

// Singleton instance
export const videoFrameExtractor = new VideoFrameExtractor();
