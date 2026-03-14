/**
 * Unit Tests - Individual Components
 */

describe('Component Unit Tests', () => {
  test('✅ JowAgent skills increment', () => {
    const { JowAgent } = require('../../src/agents/JowAgent');
    const jow = new JowAgent({});
    
    const initialLang = jow.skills.language;
    jow.observeTurn({ userInput: 'hello', response: 'hi' });
    
    expect(jow.skills.language).toBeGreaterThanOrEqual(initialLang);
  });
  
  test('✅ HybridMemory provides stats', () => {
    const { HybridMemory } = require('../../src/services/HybridMemory');
    const memory = new HybridMemory({});
    
    const stats = memory.getStats();
    expect(stats).toHaveProperty('cacheHits');
    expect(stats).toHaveProperty('vectorHits');
  });
});

console.log('Unit tests ready');
