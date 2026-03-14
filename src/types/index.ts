// Core type definitions for Aria-Nova

export interface AgentConfig {
  sharedModel?: any;
  persona?: string;
  style?: string;
  [key: string]: any;
}

export interface AgentResponse {
  text: string;
  tokensGenerated?: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface AttentionWeight {
  token: string;
  weight: number;
}

export interface JowState {
  age: number;
  skills: {
    language: number;
    memory: number;
    emotion: number;
    knowledge: number;
  };
  personality: {
    playfulness: number;
    seriousness: number;
    helpfulness: number;
    independence: number;
    curiosity: number;
  };
  milestones: {
    firstWords: boolean;
    firstQuestion: boolean;
    emotionRecognition: boolean;
    independentThought: boolean;
    maturity: boolean;
  };
}

export interface VectorEntry {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export interface MemoryEntry {
  text: string;
  embedding?: number[];
  timestamp: number;
  importance?: number;
}
