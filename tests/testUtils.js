/**
 * Test Utilities
 */

export const mockEcosystem = () => ({
  initialized: true,
  delta: {
    currentEmotion: { id: 'neutral', intensity: 0.5 },
  },
  jow: {
    getProgress: () => ({ age: 10, skills: { language: 5, memory: 5, emotion: 5, knowledge: 5 } }),
    getStats: () => ({ age: 10, skills: { language: 5, memory: 5, emotion: 5, knowledge: 5 } }),
  },
  bus: {
    on: jest.fn(),
    emit: jest.fn(),
  },
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    getStats: () => ({ hits: 10, misses: 5, hitRate: '66%' }),
  },
  think: jest.fn(async (input) => ({
    text: `Response to: ${input}`,
    attention: [{ token: 'test', weight: 0.8 }],
    confidence: 0.85,
    jow: { age: 10 },
  })),
  speak: jest.fn(),
  config: { autoSpeak: false },
});

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockVoiceOrb = () => ({
  state: 'idle',
  audioData: new Float32Array(256),
  amplitude: 0.5,
  isRecording: false,
  startListening: jest.fn(),
  stopListening: jest.fn(),
  setThinking: jest.fn(),
  setSpeaking: jest.fn(),
  setState: jest.fn(),
  error: null,
});
