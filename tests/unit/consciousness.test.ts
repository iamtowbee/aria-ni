// tests/unit/consciousness.test.ts
/**
 * Tests for AI Consciousness Systems
 */

import { dreamEngine } from '../../src/ai/consciousness/DreamEngine';
import { relationshipEvolution } from '../../src/ai/consciousness/RelationshipEvolution';
import { metaAwareness } from '../../src/ai/consciousness/MetaAwareness';

describe('AI Consciousness', () => {
  describe('DreamEngine', () => {
    it('should add memories', async () => {
      await dreamEngine.addMemory('Test', 0.5, 0.7, ['test'], 'core');
      const stats = dreamEngine.getMemoryStats();
      expect(stats.totalMemories).toBeGreaterThan(0);
    });

    it('should track emotions', () => {
      const state = dreamEngine.getEmotionalState();
      expect(state).toHaveProperty('happiness');
      expect(state.happiness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RelationshipEvolution', () => {
    it('should process conversations', async () => {
      await relationshipEvolution.processConversation(
        [{ text: 'Hi', isUser: true }],
        0.5,
        0.5
      );
      const status = relationshipEvolution.getRelationshipStatus();
      expect(status).toHaveProperty('level');
    });
  });

  describe('MetaAwareness', () => {
    it('should reflect', async () => {
      const reflection = await metaAwareness.reflect('test');
      expect(reflection).toHaveProperty('thought');
    });
  });
});
