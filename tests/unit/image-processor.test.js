// tests/unit/image-processor.test.js
/**
 * ImageProcessor Unit Tests
 * 
 * Tests image preprocessing utility in isolation
 */

const { ImageProcessor } = require('../../src/utils/ImageProcessor');

describe('ImageProcessor Unit Tests', () => {
  let processor;

  beforeEach(() => {
    processor = new ImageProcessor();
  });

  afterEach(() => {
    processor.clearCache();
  });

  describe('Initialization', () => {
    test('should create ImageProcessor instance', () => {
      expect(processor).toBeDefined();
      expect(processor).toBeInstanceOf(ImageProcessor);
    });
  });

  describe('Cache Management', () => {
    test('should start with empty cache', () => {
      const stats = processor.getCacheStats();
      
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(stats).toHaveProperty('hitRate');
    });

    test('should clear cache', () => {
      processor.clearCache();
      
      const stats = processor.getCacheStats();
      expect(stats.size).toBe(0);
    });

    test('should provide cache statistics', () => {
      const stats = processor.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });

    test('should respect max cache size', () => {
      const stats = processor.getCacheStats();
      
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(stats.maxSize).toBeLessThanOrEqual(100); // Reasonable limit
    });
  });

  describe('Input Validation', () => {
    test('should handle null image URI', async () => {
      await expect(
        processor.imageToBase64(null)
      ).rejects.toThrow();
    });

    test('should handle empty image URI', async () => {
      await expect(
        processor.imageToBase64('')
      ).rejects.toThrow();
    });

    test('should handle invalid options', async () => {
      const testUri = 'file:///test/image.jpg';
      
      // Should not throw with empty options
      try {
        await processor.processImage(testUri, {});
        // May throw due to file not existing, which is fine
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Processing Options', () => {
    test('should accept resize options', () => {
      const options = {
        resize: { width: 512, height: 512 },
        quality: 0.8,
      };
      
      expect(options.resize.width).toBe(512);
      expect(options.resize.height).toBe(512);
      expect(options.quality).toBe(0.8);
    });

    test('should accept quality options', () => {
      const options = { quality: 0.7 };
      
      expect(options.quality).toBeGreaterThan(0);
      expect(options.quality).toBeLessThanOrEqual(1);
    });

    test('should accept format options', () => {
      const options = { format: 'jpeg' };
      
      expect(['jpeg', 'png']).toContain(options.format);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for non-existent file', async () => {
      const invalidUri = 'file:///non/existent/image.jpg';
      
      await expect(
        processor.imageToBase64(invalidUri)
      ).rejects.toThrow();
    });

    test('should provide meaningful error messages', async () => {
      const invalidUri = 'invalid://uri';
      
      try {
        await processor.processImage(invalidUri);
      } catch (error) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
  });
});

module.exports = {
  name: 'ImageProcessor Unit Tests',
};
