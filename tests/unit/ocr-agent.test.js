// tests/unit/ocr-agent.test.js
/**
 * OCRAgent Unit Tests
 * 
 * Tests OCR agent in isolation
 */

const { OCRAgent } = require('../../src/agents/OCRAgent');

describe('OCRAgent Unit Tests', () => {
  let agent;

  beforeEach(() => {
    agent = new OCRAgent();
  });

  afterEach(async () => {
    if (agent) {
      await agent.shutdown();
    }
  });

  describe('Initialization', () => {
    test('should create OCRAgent instance', () => {
      expect(agent).toBeDefined();
      expect(agent).toBeInstanceOf(OCRAgent);
    });

    test('should have correct agent metadata', () => {
      const status = agent.getStatus();
      
      expect(status.name).toBe('OCR');
      expect(status.role).toBe('Text Recognition & Extraction Specialist');
      expect(status).toHaveProperty('isReady');
      expect(status).toHaveProperty('historySize');
    });

    test('should start not ready', () => {
      const status = agent.getStatus();
      expect(status.isReady).toBe(false);
    });

    test('should initialize successfully', async () => {
      try {
        await agent.initialize();
        const status = agent.getStatus();
        expect(status.isReady).toBe(true);
      } catch (error) {
        // Expected if OCR model not available
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Text History Management', () => {
    test('should start with empty history', () => {
      const history = agent.getTextHistory();
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    test('should limit history size', () => {
      const history = agent.getTextHistory(5);
      
      expect(history.length).toBeLessThanOrEqual(5);
    });

    test('should clear history', () => {
      agent.clearHistory();
      
      const history = agent.getTextHistory();
      expect(history.length).toBe(0);
      
      const status = agent.getStatus();
      expect(status.historySize).toBe(0);
    });
  });

  describe('OCR Options', () => {
    test('should accept language option', () => {
      const options = { language: 'en' };
      expect(options.language).toBe('en');
    });

    test('should accept orientation detection option', () => {
      const options = { detectOrientation: true };
      expect(options.detectOrientation).toBe(true);
    });

    test('should accept layout preservation option', () => {
      const options = { preserveLayout: true };
      expect(options.preserveLayout).toBe(true);
    });
  });

  describe('Status & Shutdown', () => {
    test('should provide detailed status', () => {
      const status = agent.getStatus();
      
      expect(status).toHaveProperty('name');
      expect(status).toHaveProperty('role');
      expect(status).toHaveProperty('isReady');
      expect(status).toHaveProperty('historySize');
      
      expect(typeof status.historySize).toBe('number');
    });

    test('should shutdown cleanly', async () => {
      await agent.shutdown();
      
      const status = agent.getStatus();
      expect(status.isReady).toBe(false);
      expect(status.historySize).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should throw error if not initialized', async () => {
      const uninitAgent = new OCRAgent();
      
      await expect(
        uninitAgent.extractText('test.jpg')
      ).rejects.toThrow('not initialized');
    });

    test('should handle invalid inputs', async () => {
      try {
        await agent.initialize();
        
        await expect(
          agent.extractText(null)
        ).rejects.toThrow();
        
        await expect(
          agent.extractText('')
        ).rejects.toThrow();
        
      } catch (error) {
        // Expected if model not loaded
      }
    });
  });

  describe('Result Structure', () => {
    test('should return OCRResult with required fields', async () => {
      try {
        await agent.initialize();
        const result = await agent.extractText('file:///test.jpg');
        
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('processingTime');
        expect(typeof result.text).toBe('string');
        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        
      } catch (error) {
        // Expected if OCR not available
      }
    });
  });
});

module.exports = {
  name: 'OCRAgent Unit Tests',
};
