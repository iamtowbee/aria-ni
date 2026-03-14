// src/integration/EcosystemBridge.ts
/**
 * Ecosystem Bridge
 * 
 * Connects existing AIEcosystem with modern UI components
 * Provides clean interface for UI to interact with agents
 */

import { AIEcosystem } from '../AIEcosystem';

export interface AgentMessage {
  id: string;
  text: string;
  isUser: boolean;
  agentId: string;
  timestamp: number;
  reactions?: string[];
  metadata?: any;
}

export interface AgentResponse {
  text: string;
  emotion?: any;
  shouldSpeak?: boolean;
  metadata?: any;
}

export class EcosystemBridge {
  private ecosystem: AIEcosystem;
  private messageHistory: Map<string, AgentMessage[]>;
  private activeAgent: string;
  private messageCallbacks: Set<(message: AgentMessage) => void>;

  constructor(ecosystem: AIEcosystem) {
    this.ecosystem = ecosystem;
    this.messageHistory = new Map();
    this.activeAgent = 'core';
    this.messageCallbacks = new Set();
  }

  /**
   * Send message to active agent
   */
  async sendMessage(
    text: string,
    options: {
      agentId?: string;
      conversationId?: string;
      images?: string[];
    } = {}
  ): Promise<AgentResponse> {
    const agentId = options.agentId || this.activeAgent;
    const conversationId = options.conversationId || 'default';

    // Add user message to history
    const userMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      text,
      isUser: true,
      agentId,
      timestamp: Date.now(),
    };

    this.addToHistory(conversationId, userMessage);
    this.notifyCallbacks(userMessage);

    // Route to appropriate agent
    let response: AgentResponse;

    try {
      switch (agentId) {
        case 'core':
          response = await this.handleCoreAgent(text);
          break;
        
        case 'vision':
          response = await this.handleVisionAgent(text, options.images);
          break;
        
        case 'ocr':
          response = await this.handleOCRAgent(text, options.images);
          break;
        
        case 'creativity':
          response = await this.handleCreativityAgent(text);
          break;
        
        case 'alpha':
          response = await this.handleAlphaAgent(text, options.images);
          break;
        
        case 'beta':
          response = await this.handleBetaAgent(text);
          break;
        
        case 'gamma':
          response = await this.handleGammaAgent(text);
          break;
        
        case 'delta':
          response = await this.handleDeltaAgent(text);
          break;
        
        default:
          response = await this.handleCoreAgent(text);
      }

      // Add AI response to history
      const aiMessage: AgentMessage = {
        id: `msg_${Date.now() + 1}`,
        text: response.text,
        isUser: false,
        agentId,
        timestamp: Date.now(),
        metadata: response.metadata,
      };

      this.addToHistory(conversationId, aiMessage);
      this.notifyCallbacks(aiMessage);

      return response;

    } catch (error) {
      console.error(`Error with ${agentId} agent:`, error);
      throw error;
    }
  }

  /**
   * Core Agent - General conversation
   */
  private async handleCoreAgent(message: string): Promise<AgentResponse> {
    const response = await this.ecosystem.core.chat(message);
    
    return {
      text: response.text || response,
      emotion: response.emotion,
      shouldSpeak: false,
    };
  }

  /**
   * Vision Agent - Image analysis
   */
  private async handleVisionAgent(message: string, images?: string[]): Promise<AgentResponse> {
    if (!images || images.length === 0) {
      return {
        text: "I'm Vision agent. Please share an image for me to analyze.",
      };
    }

    // In production, use actual vision model
    // For now, simulate response
    return {
      text: `I can see your image. ${message}\n\nNote: Full vision capabilities require model integration.`,
    };
  }

  /**
   * OCR Agent - Text extraction
   */
  private async handleOCRAgent(message: string, images?: string[]): Promise<AgentResponse> {
    if (!images || images.length === 0) {
      return {
        text: "I'm OCR agent. Please share an image with text for me to extract.",
      };
    }

    return {
      text: `I'll extract text from your image. ${message}\n\nNote: OCR requires integration with text recognition service.`,
    };
  }

  /**
   * Creativity Agent - Creative content
   */
  private async handleCreativityAgent(message: string): Promise<AgentResponse> {
    const response = await this.ecosystem.creativity.generate(message);
    
    return {
      text: response.content || response,
      metadata: { type: 'creative' },
    };
  }

  /**
   * Alpha Agent - Media handling
   */
  private async handleAlphaAgent(message: string, images?: string[]): Promise<AgentResponse> {
    // Alpha handles media - use existing AlphaAgent
    const response = await this.ecosystem.alpha.processMediaRequest(message, images);
    
    return {
      text: response.text || response,
    };
  }

  /**
   * Beta Agent - Speech/Communication
   */
  private async handleBetaAgent(message: string): Promise<AgentResponse> {
    // Beta handles voice - use existing BetaAgent
    return {
      text: `Beta (Communication): ${message}`,
      shouldSpeak: true,
    };
  }

  /**
   * Gamma Agent - Memory
   */
  private async handleGammaAgent(message: string): Promise<AgentResponse> {
    // Store in memory
    await this.ecosystem.gamma.store({
      type: 'conversation',
      content: message,
      timestamp: Date.now(),
    });

    // Retrieve relevant memories
    const memories = await this.ecosystem.gamma.retrieve(message);
    
    return {
      text: `I've stored that in memory. I have ${memories.length} related memories.`,
      metadata: { memories },
    };
  }

  /**
   * Delta Agent - Emotional analysis
   */
  private async handleDeltaAgent(message: string): Promise<AgentResponse> {
    const emotion = await this.ecosystem.delta.analyzeEmotion(message);
    
    return {
      text: `I sense ${emotion.primary} emotion in your message. How are you feeling?`,
      emotion,
    };
  }

  /**
   * Switch active agent
   */
  setActiveAgent(agentId: string) {
    this.activeAgent = agentId;
  }

  /**
   * Get active agent
   */
  getActiveAgent(): string {
    return this.activeAgent;
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string = 'default'): AgentMessage[] {
    return this.messageHistory.get(conversationId) || [];
  }

  /**
   * Add message to history
   */
  private addToHistory(conversationId: string, message: AgentMessage) {
    const history = this.messageHistory.get(conversationId) || [];
    history.push(message);
    this.messageHistory.set(conversationId, history);
  }

  /**
   * Subscribe to new messages
   */
  onMessage(callback: (message: AgentMessage) => void) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * Notify callbacks of new message
   */
  private notifyCallbacks(message: AgentMessage) {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  /**
   * Get all available agents
   */
  getAgents() {
    return [
      {
        id: 'core',
        name: 'Core',
        emoji: '🤖',
        color: '#3B82F6',
        description: 'General AI assistant',
        available: true,
      },
      {
        id: 'vision',
        name: 'Vision',
        emoji: '👁️',
        color: '#8B5CF6',
        description: 'Image analysis',
        available: true,
      },
      {
        id: 'ocr',
        name: 'OCR',
        emoji: '📝',
        color: '#10B981',
        description: 'Text extraction',
        available: true,
      },
      {
        id: 'creativity',
        name: 'Creativity',
        emoji: '🎨',
        color: '#EC4899',
        description: 'Creative content',
        available: true,
      },
      {
        id: 'alpha',
        name: 'Alpha',
        emoji: '📱',
        color: '#F59E0B',
        description: 'Media handling',
        available: true,
      },
      {
        id: 'beta',
        name: 'Beta',
        emoji: '💬',
        color: '#3B82F6',
        description: 'Communication',
        available: true,
      },
      {
        id: 'gamma',
        name: 'Gamma',
        emoji: '💾',
        color: '#6366F1',
        description: 'Memory',
        available: true,
      },
      {
        id: 'delta',
        name: 'Delta',
        emoji: '❤️',
        color: '#EF4444',
        description: 'Emotional support',
        available: true,
      },
    ];
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId: string = 'default') {
    this.messageHistory.delete(conversationId);
  }

  /**
   * Export conversation
   */
  exportConversation(conversationId: string = 'default'): string {
    const history = this.getHistory(conversationId);
    return JSON.stringify(history, null, 2);
  }
}
