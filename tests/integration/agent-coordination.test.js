/**
 * Integration Tests - Agent Coordination
 */

describe('Agent Coordination Integration', () => {
  test('✅ Event bus connects agents', () => {
    const { AgentBus } = require('../../src/core/events/AgentBus');
    const bus = new AgentBus();
    
    let eventFired = false;
    bus.on('test:event', () => { eventFired = true; });
    bus.emit('test:event', {});
    
    expect(eventFired).toBe(true);
  });
  
  test('✅ Hybrid memory integrates systems', () => {
    const { HybridMemory } = require('../../src/services/HybridMemory');
    const memory = new HybridMemory({});
    
    expect(memory).toBeDefined();
    expect(memory.getStats).toBeDefined();
  });
  
  test('✅ Jow integrates with agents', () => {
    const { JowAgent } = require('../../src/agents/JowAgent');
    const jow = new JowAgent({});
    
    jow.observeTurn({ userInput: 'test', response: 'test' });
    expect(jow.age).toBe(1);
  });
});

console.log('Integration tests ready');
