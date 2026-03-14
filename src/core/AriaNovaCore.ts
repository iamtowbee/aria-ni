// Simple wrapper that uses existing systems
const { UnifiedAIEcosystem } = require('../AIEcosystem-Unified');

class AriaNovaCore extends UnifiedAIEcosystem {
  constructor(config = {}) {
    super(config);
    console.log('[AriaNovaCore] Initialized with Aria + Nova features');
  }
}

const createAriaNovaCore = (config) => new AriaNovaCore(config);

module.exports = { AriaNovaCore, createAriaNovaCore };
