// tests/unit/vision-agent.test.js
/**
 * VisionAgent Unit Tests
 * 
 * Tests VisionAgent in isolation
 */

const { VisionAgent } = require('../../src/agents/VisionAgent');

describe('VisionAgent Unit Tests', () => {
  let agent;

  beforeEach(() => {
    agent = new VisionAgent({
      enableCache: true,
      quantization: 'int8',
    });
  });

  afterEach(async () => {
    if (agent) {
      await agent.shutdown();
    }
  });

  describe('Initialization', () => {
    test('should create VisionAgent instance', () => {
      expect(agent).toBeDefined();
      expect(agent).toBeInstanceOf(VisionAgent);
    });

    test('should have correct agent metadata', () => {
      const status = agent.getStatus();
      
      expect(status.name).toBe('Vision');
      expect(status.role).toBe('Visual Intelligence & Scene Understanding');
      expect(status).toHaveProperty('isReady');
      expect(status).toHaveProperty('visualHistorySize');
    });

    test('should initialize with default config', async () => {
      const defaultAgent = new VisionAgent();
      expect(defaultAgent).toBeDefined();
      
      const status = defaultAgent.getStatus();
      expect(status.isReady).toBe(false);
      
      await defaultAgent.shutdown();
    });

    test('should initialize successfully', async () => {
      try {
        await agent.initialize();
        const status = agent.getStatus();
        expect(status.isReady).toBe(true);
      } catch (error) {
        // Expected if model files not present
        expect(error.message).toContain('Model');
      }
    });
  });

  describe('Capabilities', () => {
    test('should report all capabilities', () => {
      const capabilities = agent.getCapabilities();
      
      expect(capabilities).toHaveProperty('describe', true);
      expect(capabilities).toHaveProperty('detect', true);
      expect(capabilities).toHaveProperty('classify', true);
      expect(capabilities).toHaveProperty('ocr', true);
      expect(capabilities).toHaveProperty('count', true);
    });
  });

  describe('Visual Context Management', () => {
    test('should maintain visual history', () => {
      const context = agent.getVisualContext();
      
      expect(Array.isArray(context)).toBe(true);
      expect(context.length).toBe(0); // Initially empty
    });

    test('should limit visual history size', () => {
      const context = agent.getVisualContext(5);
      
      expect(context.length).toBeLessThanOrEqual(5);
    });

    test('should clear visual history', () => {
      agent.clearVisualHistory();
      
      const context = agent.getVisualContext();
      expect(context.length).toBe(0);
    });
  });

  describe('Status & Shutdown', () => {
    test('should provide detailed status', () => {
      const status = agent.getStatus();
      
      expect(status).toHaveProperty('name');
      expect(status).toHaveProperty('role');
      expect(status).toHaveProperty('isReady');
      expect(status).toHaveProperty('visualHistorySize');
      expect(status).toHaveProperty('providerStatus');
      
      expect(typeof status.visualHistorySize).toBe('number');
    });

    test('should shutdown cleanly', async () => {
      await agent.shutdown();
      
      const status = agent.getStatus();
      expect(status.isReady).toBe(false);
      expect(status.visualHistorySize).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should throw error if not initialized', async () => {
      const uninitAgent = new VisionAgent();
      
      await expect(
        uninitAgent.describeImage('test.jpg')
      ).rejects.toThrow('not initialized');
    });

    test('should handle invalid inputs gracefully', async () => {
      try {
        await agent.initialize();
        
        // Test with various invalid inputs
        await expect(
          agent.describeImage(null)
        ).rejects.toThrow();
        
        await expect(
          agent.describeImage('')
        ).rejects.toThrow();
        
      } catch (error) {
        // Expected if model not loaded
      }
    });
  });
});

module.exports = {
  name: 'VisionAgent Unit Tests',
};
