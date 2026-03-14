// src/hooks/adapters/AgentAdapter.ts
/**
 * Agent Adapters
 * 
 * Bridges the existing agent architecture with the new hook interface
 */

import { CoreAgent } from '../../agents/CoreAgent';
import { VisionAgent } from '../../agents/VisionAgent';
import { OCRAgent } from '../../agents/OCRAgent';
import { CreativityAgent } from '../../agents/CreativityAgent';

// Simple mock model for agents that need it
class MockModel {
  async load() {
    return true;
  }

  async generate(prompt: string, options: any = {}) {
    // Simple mock responses
    const responses = [
      "I understand. How can I help you with that?",
      "That's interesting! Tell me more.",
      "I'm here to assist you with that.",
      "Great question! Let me think about that.",
      "I can definitely help with that.",
    ];
    
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      tokensGenerated: 50,
      latency: 100,
    };
  }

  async generateStream(prompt: string, options: any, callback: Function) {
    const text = "I'm processing your request...";
    callback(text, text);
    return { text, tokensGenerated: 50 };
  }

  getInfo() {
    return { model: 'mock', version: '1.0' };
  }
}

// Base adapter interface
export interface AgentAdapter {
  processMessage(text: string): Promise<string>;
  processImage?(imageUri: string, prompt: string): Promise<string>;
}

// Core Agent Adapter
export class CoreAgentAdapter implements AgentAdapter {
  private agent: CoreAgent;

  constructor() {
    this.agent = new CoreAgent({ sharedModel: new MockModel() });
    this.agent.load().catch(console.error);
  }

  async processMessage(text: string): Promise<string> {
    try {
      const result = await this.agent.reason({
        text,
        context: {},
        emotionContext: null,
      });
      return result.text || 'I apologize, I had trouble processing that.';
    } catch (error) {
      console.error('CoreAgent error:', error);
      return 'I encountered an error. Please try again.';
    }
  }
}

// Vision Agent Adapter
export class VisionAgentAdapter implements AgentAdapter {
  private agent: VisionAgent;

  constructor() {
    this.agent = new VisionAgent({ 
      sharedModel: new MockModel(),
      visionProvider: null // Will use mock
    });
    this.agent.load().catch(console.error);
  }

  async processMessage(text: string): Promise<string> {
    return 'I specialize in image analysis. Please share an image for me to analyze.';
  }

  async processImage(imageUri: string, prompt: string): Promise<string> {
    try {
      const result = await this.agent.analyzeImage({
        imageUri,
        prompt: prompt || 'What do you see in this image?',
        detail: 'high',
      });
      return result.text || 'I analyzed the image successfully.';
    } catch (error) {
      console.error('VisionAgent error:', error);
      return 'I had trouble analyzing that image. Please try another one.';
    }
  }
}

// OCR Agent Adapter
export class OCRAgentAdapter implements AgentAdapter {
  private agent: OCRAgent;

  constructor() {
    this.agent = new OCRAgent({ 
      sharedModel: new MockModel(),
      ocrProvider: null // Will use mock
    });
    this.agent.load().catch(console.error);
  }

  async processMessage(text: string): Promise<string> {
    return 'I specialize in reading text from images. Share an image with text and I\'ll extract it for you.';
  }

  async processImage(imageUri: string, prompt: string): Promise<string> {
    try {
      const result = await this.agent.extractText({
        imageUri,
        language: 'en',
      });
      return result.text || 'I extracted text from the image.';
    } catch (error) {
      console.error('OCRAgent error:', error);
      return 'I had trouble reading text from that image. Please try a clearer image.';
    }
  }
}

// Creativity Agent Adapter
export class CreativityAgentAdapter implements AgentAdapter {
  private agent: CreativityAgent;

  constructor() {
    this.agent = new CreativityAgent({ sharedModel: new MockModel() });
    this.agent.load().catch(console.error);
  }

  async processMessage(text: string): Promise<string> {
    try {
      const result = await this.agent.create({
        prompt: text,
        style: 'creative',
        temperature: 0.8,
      });
      return result.text || 'Here\'s my creative response!';
    } catch (error) {
      console.error('CreativityAgent error:', error);
      return 'I had trouble being creative just now. Please try again.';
    }
  }
}

// Factory to create adapters
export class AgentFactory {
  static createAgent(agentId: string): AgentAdapter {
    switch (agentId) {
      case 'core':
        return new CoreAgentAdapter();
      case 'vision':
        return new VisionAgentAdapter();
      case 'ocr':
        return new OCRAgentAdapter();
      case 'creativity':
        return new CreativityAgentAdapter();
      default:
        return new CoreAgentAdapter();
    }
  }
}
