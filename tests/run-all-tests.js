#!/usr/bin/env node
/**
 * Complete Test Runner
 * Runs all tests: unit, integration, and e2e
 */

const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║   ARIA-NOVA ULTIMATE - COMPLETE TEST SUITE          ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  tests: [],
};

// Mock implementations for browser-only APIs
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

if (typeof window === 'undefined') {
  global.window = {
    AudioContext: function() {
      return {
        createAnalyser: () => ({
          fftSize: 512,
          frequencyBinCount: 256,
          smoothingTimeConstant: 0.85,
          getFloatFrequencyData: () => {},
        }),
        createMediaStreamSource: () => ({
          connect: () => {},
        }),
        close: () => {},
      };
    },
  };
}

if (typeof navigator === 'undefined') {
  global.navigator = {
    mediaDevices: {
      getUserMedia: async () => ({
        getTracks: () => [],
      }),
    },
  };
}

// Test runner function
async function runTest(name, testFn) {
  results.total++;
  process.stdout.write(`  ${name} ... `);
  
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log('✅ PASS');
    return true;
  } catch (err) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: err.message });
    console.log('❌ FAIL');
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Phase 1: Core System Tests');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Test 1: File structure
  await runTest('Files exist in correct locations', () => {
    const files = [
      'src/AIEcosystem.js',
      'src/AIEcosystem-Unified.js',
      'src/core/AriaNovaCore.js',
      'src/services/HybridMemory.js',
      'src/agents/JowAgent.js',
    ];
    
    for (const file of files) {
      const exists = fs.existsSync(path.join(__dirname, '..', file));
      if (!exists) throw new Error(`Missing: ${file}`);
    }
  });
  
  // Test 2: All agents present
  await runTest('All 9 agents are present', () => {
    const agents = [
      'CoreAgent', 'AlphaAgent', 'BetaAgent', 'GammaAgent',
      'DeltaAgent', 'CreativityAgent', 'InterfaceAgent',
      'DeltaAgent-Enhanced', 'JowAgent',
    ];
    
    for (const agent of agents) {
      const exists = fs.existsSync(path.join(__dirname, '..', 'src', 'agents', `${agent}.js`));
      if (!exists) throw new Error(`Missing: ${agent}.js`);
    }
  });
  
  // Test 3: All services present
  await runTest('All 8 services are present', () => {
    const services = [
      'ResponseCache', 'ContextCompressor', 'SmartSuggestions',
      'MultiModalProcessor', 'VoiceCommands', 'HybridMemory',
      'LlamaModel', 'ModelDownloader',
    ];
    
    for (const service of services) {
      const exists = fs.existsSync(path.join(__dirname, '..', 'src', 'services', `${service}.js`));
      if (!exists) throw new Error(`Missing: ${service}.js`);
    }
  });
  
  // Test 4: All UI components present
  await runTest('All UI components are present', () => {
    const components = [
      'AnimatedAvatar.jsx',
      'DataVisualization.jsx',
      'MultiModalInput.jsx',
      'SplitScreenView.jsx',
    ];
    
    for (const comp of components) {
      const exists = fs.existsSync(path.join(__dirname, '..', 'src', 'components', comp));
      if (!exists) throw new Error(`Missing: ${comp}`);
    }
  });
  
  // Test 5: Voice Orb components
  await runTest('Voice Orb components are present', () => {
    const files = ['useVoiceOrb.js', 'VoiceOrb.jsx', 'VoiceOrbProvider.jsx'];
    for (const file of files) {
      const exists = fs.existsSync(path.join(__dirname, '..', 'src', 'components', 'voice-orb', file));
      if (!exists) throw new Error(`Missing voice-orb/${file}`);
    }
  });
  
  // Test 6: Lottie Avatar components
  await runTest('Lottie Avatar components are present', () => {
    const files = ['Lottie3DMapper.js', 'AvatarCanvas.jsx', 'AttentionMap.jsx'];
    for (const file of files) {
      const exists = fs.existsSync(path.join(__dirname, '..', 'src', 'components', 'lottie-avatar', file));
      if (!exists) throw new Error(`Missing lottie-avatar/${file}`);
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Phase 2: Module Import Tests');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Test 7: Core modules can be required
  await runTest('AriaNovaCore can be imported', () => {
    const { AriaNovaCore, createAriaNovaCore } = require('../src/core/AriaNovaCore');
    if (!AriaNovaCore) throw new Error('AriaNovaCore not exported');
    if (!createAriaNovaCore) throw new Error('createAriaNovaCore not exported');
  });
  
  // Test 8: Services can be required
  await runTest('Services can be imported', () => {
    const { HybridMemory } = require('../src/services/HybridMemory');
    const { JowAgent } = require('../src/agents/JowAgent');
    if (!HybridMemory) throw new Error('HybridMemory not exported');
    if (!JowAgent) throw new Error('JowAgent not exported');
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Phase 3: Component Integration Tests');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Test 9: JowAgent functionality
  await runTest('JowAgent learns from interactions', () => {
    const { JowAgent } = require('../src/agents/JowAgent');
    const jow = new JowAgent({});
    
    const initialAge = jow.age;
    jow.observeTurn({ userInput: 'test', response: 'test' });
    
    if (jow.age !== initialAge + 1) {
      throw new Error(`Age should be ${initialAge + 1}, got ${jow.age}`);
    }
  });
  
  // Test 10: JowAgent skills progress
  await runTest('JowAgent skills increment correctly', () => {
    const { JowAgent } = require('../src/agents/JowAgent');
    const jow = new JowAgent({});
    
    const initialLang = jow.skills.language;
    
    for (let i = 0; i < 5; i++) {
      jow.observeTurn({ userInput: 'hello', response: 'hi' });
    }
    
    if (jow.skills.language <= initialLang) {
      throw new Error('Language skill did not improve');
    }
  });
  
  // Test 11: HybridMemory initialization
  await runTest('HybridMemory initializes correctly', async () => {
    const { HybridMemory } = require('../src/services/HybridMemory');
    const memory = new HybridMemory({});
    
    await memory.initialize();
    
    const stats = memory.getStats();
    if (!stats.hasOwnProperty('cacheHits')) {
      throw new Error('Stats missing cacheHits');
    }
  });
  
  // Test 12: Event Bus
  await runTest('Event Bus connects components', () => {
    const { AgentBus } = require('../src/core/events/AgentBus');
    const bus = new AgentBus();
    
    let eventFired = false;
    bus.on('test:event', () => { eventFired = true; });
    bus.emit('test:event', {});
    
    if (!eventFired) throw new Error('Event did not fire');
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Phase 4: End-to-End Flow Tests');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Test 13: Full system initialization
  await runTest('Complete system initializes', async () => {
    const { createAriaNovaCore } = require('../src/core/AriaNovaCore');
    const ai = createAriaNovaCore({ cacheSize: 5 });
    
    let progressCalled = false;
    await ai.initialize(() => { progressCalled = true; });
    
    if (!ai.initialized) throw new Error('System not initialized');
    if (!progressCalled) throw new Error('Progress callback not called');
  });
  
  // Test 14: Message processing
  await runTest('System processes messages', async () => {
    const { createAriaNovaCore } = require('../src/core/AriaNovaCore');
    const ai = createAriaNovaCore({ cacheSize: 5 });
    await ai.initialize();
    
    const response = await ai.think('Hello!');
    
    if (!response.text) throw new Error('No response text');
    if (!response.jow) throw new Error('No Jow data');
    
    await ai.clearAll();
  });
  
  // Test 15: Jow observes turns
  await runTest('Jow learns from complete flow', async () => {
    const { createAriaNovaCore } = require('../src/core/AriaNovaCore');
    const ai = createAriaNovaCore({ cacheSize: 5 });
    await ai.initialize();
    
    await ai.think('First message');
    await ai.think('Second message');
    
    const status = ai.getStatus();
    if (status.jow.age !== 2) {
      throw new Error(`Expected age 2, got ${status.jow.age}`);
    }
    
    await ai.clearAll();
  });
  
  // Test 16: Cache functionality
  await runTest('Cache improves performance', async () => {
    const { createAriaNovaCore } = require('../src/core/AriaNovaCore');
    const ai = createAriaNovaCore({ cacheSize: 5 });
    await ai.initialize();
    
    const query = 'test query for cache';
    
    const start1 = Date.now();
    const r1 = await ai.think(query);
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    const r2 = await ai.think(query);
    const time2 = Date.now() - start2;
    
    if (r2.source !== 'cache') {
      throw new Error('Second query not from cache');
    }
    
    if (time2 >= time1) {
      throw new Error('Cache not faster than first query');
    }
    
    await ai.clearAll();
  });
  
  // Test 17: Status reporting
  await runTest('System reports complete status', async () => {
    const { createAriaNovaCore } = require('../src/core/AriaNovaCore');
    const ai = createAriaNovaCore({ cacheSize: 5 });
    await ai.initialize();
    
    const status = ai.getStatus();
    
    if (!status.initialized) throw new Error('Status missing initialized');
    if (!status.nova) throw new Error('Status missing nova');
    if (!status.jow) throw new Error('Status missing jow');
    if (!status.memory) throw new Error('Status missing memory');
    
    await ai.clearAll();
  });
  
  // Test 18: Data export
  await runTest('System exports complete data', async () => {
    const { createAriaNovaCore } = require('../src/core/AriaNovaCore');
    const ai = createAriaNovaCore({ cacheSize: 5 });
    await ai.initialize();
    
    await ai.think('Test message');
    
    const exported = await ai.exportData();
    
    if (!exported.nova) throw new Error('Export missing nova');
    if (!exported.jow) throw new Error('Export missing jow');
    if (!exported.memory) throw new Error('Export missing memory');
    
    await ai.clearAll();
  });
  
  // Test 19: Clear functionality
  await runTest('System clears all data', async () => {
    const { createAriaNovaCore } = require('../src/core/AriaNovaCore');
    const ai = createAriaNovaCore({ cacheSize: 5 });
    await ai.initialize();
    
    await ai.think('Test message');
    await ai.clearAll();
    
    const status = ai.getStatus();
    if (status.jow.age !== 0) {
      throw new Error(`Age should be 0 after clear, got ${status.jow.age}`);
    }
  });
  
  // Test 20: Package.json validity
  await runTest('package.json is valid SDK 54', () => {
    const pkg = require('../package.json');
    
    if (!pkg.dependencies.expo.includes('54')) {
      throw new Error('Not using Expo SDK 54');
    }
    
    if (!pkg.dependencies['react-native'].includes('0.81')) {
      throw new Error('Not using React Native 0.81');
    }
  });
  
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                   TEST SUMMARY                        ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  console.log(`  Total Tests:  ${results.total}`);
  console.log(`  ✅ Passed:     ${results.passed}`);
  console.log(`  ❌ Failed:     ${results.failed}`);
  console.log(`  ⊘  Skipped:    ${results.skipped}`);
  console.log('');
  console.log(`  Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('');
  
  if (results.failed === 0) {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL TESTS PASSED! ✅                  ║');
    console.log('║                                                       ║');
    console.log('║   Aria-Nova Ultimate is ready for production!        ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    process.exit(0);
  } else {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║              ❌ SOME TESTS FAILED ❌                  ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Failed tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  ❌ ${t.name}: ${t.error}`));
    process.exit(1);
  }
}

// Run
runAllTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
