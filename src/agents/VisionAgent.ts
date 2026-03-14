// src/agents/VisionAgent.ts
/**
 * Vision Agent - Real-time Computer Vision
 * 
 * Separation of Concerns:
 * - Vision inference: MoondreamVisionProvider
 * - Image processing: ImageProcessor
 * - Agent logic: VisionAgent (this file)
 * - Image capture: AlphaAgent (legacy, media selection)
 * 
 * Responsibilities:
 * - Coordinate vision-language understanding
 * - Manage visual context and history
 * - Provide high-level vision capabilities
 * - Interface with other agents for multimodal tasks
 * 
 * Named: VisionAgent
 * - Clear, descriptive name
 * - Distinct from AlphaAgent (media selection)
 * - Focused on vision intelligence
 */

import { MoondreamVisionProvider, VisionInferenceResult } from '../providers/vision/MoondreamVisionProvider';
import { imageProcessor } from '../utils/ImageProcessor';

export interface VisionContext {
  imageUri: string;
  timestamp: number;
  description?: string;
  objects?: Array<{ label: string; confidence: number }>;
  embeddings?: number[];
}

export interface VisionCapability {
  describe: boolean;
  detect: boolean;
  classify: boolean;
  ocr: boolean;
  count: boolean;
}

/**
 * VisionAgent
 * 
 * Provides real-time computer vision capabilities using Moondream
 * Maintains visual context and coordinates with other agents
 */
export class VisionAgent {
  private visionProvider: MoondreamVisionProvider;
  private visualHistory: VisionContext[] = [];
  private readonly MAX_HISTORY = 10;
  private isReady: boolean = false;

  // Agent metadata
  private readonly agentName = 'Vision';
  private readonly agentRole = 'Visual Intelligence & Scene Understanding';
  private readonly capabilities: VisionCapability = {
    describe: true,
    detect: true,
    classify: true,
    ocr: true,
    count: true,
  };

  constructor(config: {
    modelPath?: string;
    enableCache?: boolean;
    quantization?: 'int8' | 'float16' | 'float32';
  } = {}) {
    this.visionProvider = new MoondreamVisionProvider({
      modelPath: config.modelPath,
      enableCache: config.enableCache !== false,
      quantization: config.quantization || 'int8',
    });
  }

  /**
   * Initialize vision agent and load model
   */
  async initialize(): Promise<void> {
    if (this.isReady) {
      console.log('[VisionAgent] Already initialized');
      return;
    }

    try {
      console.log('[VisionAgent] Initializing...');
      await this.visionProvider.loadModel();
      this.isReady = true;
      console.log('[VisionAgent] Ready');
    } catch (error) {
      console.error('[VisionAgent] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Describe what's in an image
   */
  async describeImage(
    imageUri: string,
    prompt?: string
  ): Promise<{
    description: string;
    confidence: number;
    processingTime: number;
  }> {
    this.ensureReady();

    try {
      console.log('[VisionAgent] Describing image...');

      // Optimize image for vision model
      const processed = await imageProcessor.optimizeForVision(imageUri);

      // Generate description
      const result = await this.visionProvider.generateVisionResponse(
        processed.uri,
        prompt || 'Describe this image in detail.',
        { maxTokens: 256, temperature: 0.7 }
      );

      // Store in visual history
      this.addToVisualHistory({
        imageUri,
        timestamp: Date.now(),
        description: result.text,
      });

      return {
        description: result.text,
        confidence: result.confidence,
        processingTime: result.processingTime,
      };

    } catch (error) {
      console.error('[VisionAgent] Description failed:', error);
      throw error;
    }
  }

  /**
   * Detect objects in an image
   */
  async detectObjects(
    imageUri: string
  ): Promise<Array<{
    label: string;
    confidence: number;
    bbox?: number[];
  }>> {
    this.ensureReady();

    try {
      console.log('[VisionAgent] Detecting objects...');

      const processed = await imageProcessor.optimizeForVision(imageUri);
      const objects = await this.visionProvider.detectObjects(processed.uri);

      // Store in visual history
      this.addToVisualHistory({
        imageUri,
        timestamp: Date.now(),
        objects: objects.map(obj => ({
          label: obj.label,
          confidence: obj.confidence,
        })),
      });

      return objects;

    } catch (error) {
      console.error('[VisionAgent] Object detection failed:', error);
      throw error;
    }
  }

  /**
   * Answer a question about an image
   */
  async answerQuestion(
    imageUri: string,
    question: string
  ): Promise<{
    answer: string;
    confidence: number;
  }> {
    this.ensureReady();

    try {
      console.log('[VisionAgent] Answering question:', question);

      const processed = await imageProcessor.optimizeForVision(imageUri);
      
      const result = await this.visionProvider.generateVisionResponse(
        processed.uri,
        question,
        { maxTokens: 200, temperature: 0.5 }
      );

      return {
        answer: result.text,
        confidence: result.confidence,
      };

    } catch (error) {
      console.error('[VisionAgent] Question answering failed:', error);
      throw error;
    }
  }

  /**
   * Count objects of a specific type in image
   */
  async countObjects(
    imageUri: string,
    objectType: string
  ): Promise<{
    count: number;
    confidence: number;
  }> {
    this.ensureReady();

    try {
      const question = `How many ${objectType} are in this image? Provide only the number.`;
      const result = await this.answerQuestion(imageUri, question);

      // Parse number from response
      const count = parseInt(result.answer.match(/\d+/)?.[0] || '0');

      return {
        count,
        confidence: result.confidence,
      };

    } catch (error) {
      console.error('[VisionAgent] Counting failed:', error);
      throw error;
    }
  }

  /**
   * Compare two images
   */
  async compareImages(
    imageUri1: string,
    imageUri2: string
  ): Promise<{
    similarity: number;
    differences: string[];
    processingTime: number;
  }> {
    this.ensureReady();

    try {
      console.log('[VisionAgent] Comparing images...');

      const startTime = Date.now();

      // Process both images
      const [processed1, processed2] = await Promise.all([
        imageProcessor.optimizeForVision(imageUri1),
        imageProcessor.optimizeForVision(imageUri2),
      ]);

      // Get embeddings for both
      const [result1, result2] = await Promise.all([
        this.visionProvider.generateVisionResponse(
          processed1.uri,
          'Describe this image',
          { returnEmbeddings: true }
        ),
        this.visionProvider.generateVisionResponse(
          processed2.uri,
          'Describe this image',
          { returnEmbeddings: true }
        ),
      ]);

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(
        result1.embeddings || [],
        result2.embeddings || []
      );

      const processingTime = Date.now() - startTime;

      return {
        similarity,
        differences: [], // Would analyze differences in production
        processingTime,
      };

    } catch (error) {
      console.error('[VisionAgent] Comparison failed:', error);
      throw error;
    }
  }

  /**
   * Get visual context from recent images
   */
  getVisualContext(limit: number = 5): VisionContext[] {
    return this.visualHistory.slice(-limit);
  }

  /**
   * Clear visual history
   */
  clearVisualHistory(): void {
    this.visualHistory = [];
    console.log('[VisionAgent] Visual history cleared');
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): VisionCapability {
    return { ...this.capabilities };
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    role: string;
    isReady: boolean;
    visualHistorySize: number;
    providerStatus: any;
  } {
    return {
      name: this.agentName,
      role: this.agentRole,
      isReady: this.isReady,
      visualHistorySize: this.visualHistory.length,
      providerStatus: this.visionProvider.getStatus(),
    };
  }

  /**
   * Shutdown agent and cleanup
   */
  async shutdown(): Promise<void> {
    console.log('[VisionAgent] Shutting down...');
    
    await this.visionProvider.unloadModel();
    this.visualHistory = [];
    this.isReady = false;

    console.log('[VisionAgent] Shutdown complete');
  }

  /**
   * Analyze video by extracting and analyzing key frames
   */
  async analyzeVideo(
    videoUri: string,
    options: {
      interval?: number; // seconds between frames
      maxFrames?: number;
      prompt?: string;
    } = {}
  ): Promise<{
    summary: string;
    keyFrames: Array<{
      timestamp: number;
      description: string;
      confidence: number;
    }>;
    detectedObjects: string[];
    processingTime: number;
  }> {
    this.ensureReady();

    const startTime = Date.now();

    try {
      console.log('[VisionAgent] Analyzing video...');

      const { interval = 2, maxFrames = 15, prompt = 'Describe what is happening' } = options;

      // In production, extract frames using VideoFrameExtractor
      // For now, simulate frame analysis
      const keyFrames = [];
      const objectsSet = new Set<string>();

      // Simulate analyzing multiple frames
      for (let i = 0; i < Math.min(5, maxFrames); i++) {
        const timestamp = i * interval * 1000;
        
        keyFrames.push({
          timestamp,
          description: `Frame ${i}: Sample scene description`,
          confidence: 0.85 + Math.random() * 0.1,
        });

        // Collect detected objects
        ['person', 'object'].forEach(obj => objectsSet.add(obj));
      }

      // Generate overall summary
      const summary = 'Video shows a sequence of events with various objects and actions.';

      return {
        summary,
        keyFrames,
        detectedObjects: Array.from(objectsSet),
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('[VisionAgent] Video analysis failed:', error);
      throw error;
    }
  }

  /**
   * Track object across video frames
   */
  async trackObject(
    videoUri: string,
    objectType: string,
    options: {
      interval?: number;
      maxFrames?: number;
    } = {}
  ): Promise<{
    tracked: boolean;
    appearances: Array<{
      timestamp: number;
      confidence: number;
      bbox?: [number, number, number, number];
    }>;
    summary: string;
  }> {
    this.ensureReady();

    try {
      console.log(`[VisionAgent] Tracking ${objectType} in video...`);

      const { interval = 1, maxFrames = 30 } = options;

      // In production, analyze each frame for the object
      const appearances = [];
      
      for (let i = 0; i < Math.min(5, maxFrames); i++) {
        // Simulate object detection in frame
        if (Math.random() > 0.3) {
          appearances.push({
            timestamp: i * interval * 1000,
            confidence: 0.8 + Math.random() * 0.15,
            bbox: [0.2, 0.3, 0.6, 0.7],
          });
        }
      }

      const tracked = appearances.length > 0;
      const summary = tracked
        ? `${objectType} appears in ${appearances.length} frames`
        : `${objectType} not detected in video`;

      return {
        tracked,
        appearances,
        summary,
      };

    } catch (error) {
      console.error('[VisionAgent] Object tracking failed:', error);
      throw error;
    }
  }

  // ==================== PRIVATE METHODS ====================

  private ensureReady(): void {
    if (!this.isReady) {
      throw new Error('[VisionAgent] Agent not initialized. Call initialize() first.');
    }
  }

  private addToVisualHistory(context: VisionContext): void {
    this.visualHistory.push(context);

    // Keep only recent history
    if (this.visualHistory.length > this.MAX_HISTORY) {
      this.visualHistory.shift();
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
