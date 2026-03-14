// src/agents/OCRAgent.ts
/**
 * OCR Agent - Text Recognition & Extraction
 * 
 * Separation of Concerns:
 * - Text recognition: OCRAgent (this file)
 * - Vision understanding: VisionAgent
 * - Media capture: AlphaAgent
 * 
 * Responsibilities:
 * - Extract text from images
 * - Document scanning
 * - Handwriting recognition
 * - Text localization and layout analysis
 * 
 * Agent Name: OCR
 * Role: Text Recognition Specialist
 */

import { imageProcessor } from '../utils/ImageProcessor';
import * as tf from '@tensorflow/tfjs';

export interface OCRResult {
  text: string;
  confidence: number;
  blocks?: Array<{
    text: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  language?: string;
  processingTime: number;
}

export interface OCROptions {
  language?: string;
  detectOrientation?: boolean;
  preserveLayout?: boolean;
}

/**
 * OCRAgent
 * 
 * Specialized agent for text recognition and extraction from images
 * Uses TensorFlow.js for on-device OCR
 */
export class OCRAgent {
  private model: any = null;
  private isReady: boolean = false;
  private textHistory: Array<{
    imageUri: string;
    text: string;
    timestamp: number;
  }> = [];

  private readonly agentName = 'OCR';
  private readonly agentRole = 'Text Recognition & Extraction Specialist';
  private readonly MAX_HISTORY = 20;

  constructor(config: {
    modelPath?: string;
  } = {}) {
    // OCR model initialization would go here
  }

  /**
   * Initialize OCR agent and load model
   */
  async initialize(): Promise<void> {
    if (this.isReady) {
      console.log('[OCRAgent] Already initialized');
      return;
    }

    try {
      console.log('[OCRAgent] Initializing...');
      
      // In production, load actual OCR model (e.g., TesseractJS, CRAFT+CRNN)
      // For now, mark as ready with infrastructure
      await tf.ready();
      
      this.isReady = true;
      console.log('[OCRAgent] Ready');
    } catch (error) {
      console.error('[OCRAgent] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Extract all text from image
   */
  async extractText(
    imageUri: string,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    this.ensureReady();

    const startTime = Date.now();

    try {
      console.log('[OCRAgent] Extracting text...');

      // Optimize image for OCR
      const processed = await imageProcessor.processImage(imageUri, {
        resize: { width: 1024, height: 1024 }, // Higher res for text
        quality: 0.9,
        format: 'jpeg',
      });

      // In production, run actual OCR model
      // For now, simulate OCR result
      const result: OCRResult = {
        text: 'Sample extracted text from image',
        confidence: 0.92,
        blocks: [
          {
            text: 'Sample text line 1',
            confidence: 0.94,
            bbox: [0.1, 0.2, 0.8, 0.3],
          },
          {
            text: 'Sample text line 2',
            confidence: 0.90,
            bbox: [0.1, 0.35, 0.8, 0.45],
          },
        ],
        language: options.language || 'en',
        processingTime: Date.now() - startTime,
      };

      // Store in history
      this.textHistory.push({
        imageUri,
        text: result.text,
        timestamp: Date.now(),
      });

      // Keep history limited
      if (this.textHistory.length > this.MAX_HISTORY) {
        this.textHistory.shift();
      }

      return result;

    } catch (error) {
      console.error('[OCRAgent] Text extraction failed:', error);
      throw error;
    }
  }

  /**
   * Scan document and extract structured text
   */
  async scanDocument(
    imageUri: string,
    options: OCROptions = {}
  ): Promise<{
    text: string;
    confidence: number;
    layout: 'single_column' | 'multi_column' | 'table';
    blocks: Array<{
      type: 'paragraph' | 'heading' | 'list' | 'table';
      text: string;
      confidence: number;
    }>;
  }> {
    this.ensureReady();

    try {
      console.log('[OCRAgent] Scanning document...');

      const ocrResult = await this.extractText(imageUri, {
        ...options,
        preserveLayout: true,
      });

      // Analyze layout (in production, use layout analysis model)
      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        layout: 'single_column',
        blocks: [
          {
            type: 'paragraph',
            text: ocrResult.text,
            confidence: ocrResult.confidence,
          },
        ],
      };

    } catch (error) {
      console.error('[OCRAgent] Document scan failed:', error);
      throw error;
    }
  }

  /**
   * Find specific text in image
   */
  async findText(
    imageUri: string,
    searchText: string
  ): Promise<{
    found: boolean;
    occurrences: number;
    locations?: Array<{
      text: string;
      bbox: [number, number, number, number];
      confidence: number;
    }>;
  }> {
    this.ensureReady();

    try {
      const result = await this.extractText(imageUri);
      
      const searchLower = searchText.toLowerCase();
      const textLower = result.text.toLowerCase();
      
      const occurrences = (textLower.match(new RegExp(searchLower, 'g')) || []).length;

      return {
        found: occurrences > 0,
        occurrences,
        locations: result.blocks?.filter(block => 
          block.text.toLowerCase().includes(searchLower)
        ).map(block => ({
          text: block.text,
          bbox: block.bbox,
          confidence: block.confidence,
        })),
      };

    } catch (error) {
      console.error('[OCRAgent] Text search failed:', error);
      throw error;
    }
  }

  /**
   * Get text extraction history
   */
  getTextHistory(limit: number = 10): Array<{
    imageUri: string;
    text: string;
    timestamp: number;
  }> {
    return this.textHistory.slice(-limit);
  }

  /**
   * Clear text history
   */
  clearHistory(): void {
    this.textHistory = [];
    console.log('[OCRAgent] History cleared');
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    role: string;
    isReady: boolean;
    historySize: number;
  } {
    return {
      name: this.agentName,
      role: this.agentRole,
      isReady: this.isReady,
      historySize: this.textHistory.length,
    };
  }

  /**
   * Shutdown agent
   */
  async shutdown(): Promise<void> {
    console.log('[OCRAgent] Shutting down...');
    
    this.textHistory = [];
    this.isReady = false;

    console.log('[OCRAgent] Shutdown complete');
  }

  private ensureReady(): void {
    if (!this.isReady) {
      throw new Error('[OCRAgent] Agent not initialized. Call initialize() first.');
    }
  }
}
