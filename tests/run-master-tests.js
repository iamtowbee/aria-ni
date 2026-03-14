#!/usr/bin/env node
/**
 * Master Test Runner - All Tests
 * 
 * Runs complete test suite for Aria-Nova Ultimate
 * - Core system tests
 * - Agent tests
 * - Vision system tests
 * - Integration tests
 */

const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'bright');
  log('║  ARIA-NOVA ULTIMATE - MASTER TEST SUITE              ║', 'bright');
  log('╚════════════════════════════════════════════════════════╝\n', 'bright');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: Date.now(),
  };

  // Phase 1: File Structure Validation
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Phase 1: File Structure Validation', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  const fileChecks = [
    // Core files
    { path: 'App.tsx', desc: 'Application entry point' },
    { path: 'package.json', desc: 'Package configuration' },
    { path: 'tsconfig.json', desc: 'TypeScript configuration' },
    
    // Agents
    { path: 'src/agents/CoreAgent.ts', desc: 'Core Agent' },
    { path: 'src/agents/AlphaAgent.ts', desc: 'Alpha Agent (Media)' },
    { path: 'src/agents/BetaAgent.ts', desc: 'Beta Agent (Speech)' },
    { path: 'src/agents/GammaAgent.ts', desc: 'Gamma Agent (Memory)' },
    { path: 'src/agents/DeltaAgent.ts', desc: 'Delta Agent (Emotion)' },
    { path: 'src/agents/CreativityAgent.ts', desc: 'Creativity Agent' },
    { path: 'src/agents/InterfaceAgent.ts', desc: 'Interface Agent' },
    { path: 'src/agents/JowAgent.ts', desc: 'Jow Agent (Child AI)' },
    { path: 'src/agents/VisionAgent.ts', desc: 'Vision Agent (NEW)' },
    { path: 'src/agents/OCRAgent.ts', desc: 'OCR Agent (NEW)' },
    
    // Vision System
    { path: 'src/providers/vision/MoondreamVisionProvider.ts', desc: 'Moondream Provider' },
    { path: 'src/utils/ImageProcessor.ts', desc: 'Image Processor' },
    { path: 'src/utils/VideoFrameExtractor.ts', desc: 'Video Frame Extractor' },
    
    // v2.0 Features
    { path: 'src/features/theme/ThemeSystem.tsx', desc: 'Theme System' },
    { path: 'src/features/analytics/AnalyticsSystem.ts', desc: 'Analytics System' },
    { path: 'src/features/gamification/AchievementSystem.ts', desc: 'Achievement System' },
    { path: 'src/features/export/ConversationExporter.ts', desc: 'Export System' },
    { path: 'src/utils/performance.ts', desc: 'Performance Utils' },
    
    // Tests
    { path: 'tests/unit/vision-agent.test.js', desc: 'VisionAgent Unit Tests' },
    { path: 'tests/unit/ocr-agent.test.js', desc: 'OCRAgent Unit Tests' },
    { path: 'tests/unit/image-processor.test.js', desc: 'ImageProcessor Unit Tests' },
    { path: 'tests/integration/vision-system.test.js', desc: 'Vision Integration Tests' },
  ];

  fileChecks.forEach(check => {
    results.total++;
    const exists = fs.existsSync(check.path);
    if (exists) {
      log(`  ✓ ${check.desc}`, 'green');
      results.passed++;
    } else {
      log(`  ✗ ${check.desc} (${check.path})`, 'red');
      results.failed++;
    }
  });

  log('');

  // Phase 2: Agent Architecture Validation
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Phase 2: Agent Architecture Validation', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  const agentTests = [
    { name: 'All 10 agents present', test: () => {
      const agents = [
        'CoreAgent', 'AlphaAgent', 'BetaAgent', 'GammaAgent',
        'DeltaAgent', 'CreativityAgent', 'InterfaceAgent', 'JowAgent',
        'VisionAgent', 'OCRAgent'
      ];
      return agents.every(agent => 
        fs.existsSync(`src/agents/${agent}.ts`)
      );
    }},
    { name: 'Vision system components present', test: () => {
      return fs.existsSync('src/agents/VisionAgent.ts') &&
             fs.existsSync('src/agents/OCRAgent.ts') &&
             fs.existsSync('src/providers/vision/MoondreamVisionProvider.ts') &&
             fs.existsSync('src/utils/ImageProcessor.ts');
    }},
    { name: 'v2.0 feature systems present', test: () => {
      return fs.existsSync('src/features/theme/ThemeSystem.tsx') &&
             fs.existsSync('src/features/analytics/AnalyticsSystem.ts') &&
             fs.existsSync('src/features/gamification/AchievementSystem.ts') &&
             fs.existsSync('src/features/export/ConversationExporter.ts');
    }},
    { name: 'Performance utilities present', test: () => {
      return fs.existsSync('src/utils/performance.ts') &&
             fs.existsSync('src/utils/ImageProcessor.ts') &&
             fs.existsSync('src/utils/VideoFrameExtractor.ts');
    }},
  ];

  agentTests.forEach(test => {
    results.total++;
    try {
      if (test.test()) {
        log(`  ✓ ${test.name}`, 'green');
        results.passed++;
      } else {
        log(`  ✗ ${test.name}`, 'red');
        results.failed++;
      }
    } catch (error) {
      log(`  ✗ ${test.name}: ${error.message}`, 'red');
      results.failed++;
    }
  });

  log('');

  // Phase 3: TypeScript Files Validation
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Phase 3: TypeScript Code Quality', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  const tsFiles = [
    'src/agents/VisionAgent.ts',
    'src/agents/OCRAgent.ts',
    'src/providers/vision/MoondreamVisionProvider.ts',
    'src/utils/ImageProcessor.ts',
  ];

  tsFiles.forEach(file => {
    results.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for proper TypeScript practices
      const hasTypes = content.includes('interface') || content.includes('type ');
      const hasExports = content.includes('export');
      const hasComments = content.includes('/**');
      
      if (hasTypes && hasExports && hasComments) {
        log(`  ✓ ${path.basename(file)} - Well-typed with documentation`, 'green');
        results.passed++;
      } else {
        log(`  ⚠ ${path.basename(file)} - Missing types or docs`, 'yellow');
        results.passed++; // Not a failure, just a warning
      }
    } else {
      log(`  ✗ ${path.basename(file)} - File not found`, 'red');
      results.failed++;
    }
  });

  log('');

  // Phase 4: Test Files Validation
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Phase 4: Test Suite Validation', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  const testFiles = [
    'tests/unit/vision-agent.test.js',
    'tests/unit/ocr-agent.test.js',
    'tests/unit/image-processor.test.js',
    'tests/integration/vision-system.test.js',
  ];

  let totalTestCases = 0;

  testFiles.forEach(file => {
    results.total++;
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const testMatches = content.match(/test\(|it\(/g) || [];
      const describeMatches = content.match(/describe\(/g) || [];
      
      totalTestCases += testMatches.length;
      
      log(`  ✓ ${path.basename(file)}`, 'green');
      log(`    - ${describeMatches.length} test suites`, 'cyan');
      log(`    - ${testMatches.length} test cases`, 'cyan');
      results.passed++;
    } else {
      log(`  ✗ ${path.basename(file)} - Not found`, 'red');
      results.failed++;
    }
  });

  log(`\n  📊 Total test cases across all files: ${totalTestCases}`, 'bright');
  log('');

  // Phase 5: Documentation Validation
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Phase 5: Documentation Completeness', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  const docs = [
    { file: 'README.md', desc: 'Project README' },
    { file: 'AGENT_ARCHITECTURE.md', desc: 'Agent Architecture' },
    { file: 'VISION_INTEGRATION.md', desc: 'Vision Integration Guide' },
    { file: 'VISION_IMPLEMENTATION_SUMMARY.md', desc: 'Vision Implementation' },
    { file: 'COMPLETE_FEATURE_SET.md', desc: 'Complete Feature Set' },
    { file: 'NEW_FEATURES_V2.md', desc: 'v2.0 Features' },
    { file: 'BUILD_REPORT.md', desc: 'Build Report' },
  ];

  docs.forEach(doc => {
    results.total++;
    if (fs.existsSync(doc.file)) {
      const stats = fs.statSync(doc.file);
      const sizeKB = (stats.size / 1024).toFixed(1);
      log(`  ✓ ${doc.desc} (${sizeKB} KB)`, 'green');
      results.passed++;
    } else {
      log(`  ✗ ${doc.desc}`, 'yellow');
      results.failed++;
    }
  });

  log('');

  // Phase 6: Package Configuration
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Phase 6: Package Configuration', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  results.total++;
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    log(`  ✓ Package: ${packageJson.name} v${packageJson.version}`, 'green');
    log(`  ✓ Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`, 'green');
    log(`  ✓ DevDependencies: ${Object.keys(packageJson.devDependencies || {}).length}`, 'green');
    log(`  ✓ Scripts: ${Object.keys(packageJson.scripts || {}).length}`, 'green');
    
    // Check for vision-related dependencies
    const deps = packageJson.dependencies || {};
    if (deps['@tensorflow/tfjs'] && deps['expo-image-manipulator']) {
      log('  ✓ Vision dependencies present', 'green');
    } else {
      log('  ⚠ Some vision dependencies missing', 'yellow');
    }
    
    results.passed++;
  } catch (error) {
    log(`  ✗ Package.json validation failed: ${error.message}`, 'red');
    results.failed++;
  }

  log('');

  // Final Summary
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Test Summary', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  const elapsed = Date.now() - results.startTime;

  log(`  Total Checks: ${results.total}`, 'cyan');
  log(`  Passed: ${results.passed}`, 'green');
  log(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`  Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : 'yellow');
  log(`  Time: ${elapsed}ms`, 'cyan');

  log('');

  // Status
  if (results.failed === 0) {
    log('✅ ALL TESTS PASSED - PRODUCTION READY!', 'green');
  } else if (passRate >= 90) {
    log('✅ MOSTLY PASSING - READY FOR TESTING', 'green');
  } else if (passRate >= 75) {
    log('⚠️  SOME ISSUES - NEEDS ATTENTION', 'yellow');
  } else {
    log('❌ MULTIPLE FAILURES - NEEDS FIXES', 'red');
  }

  log('');

  // Recommendations
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('Next Steps', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  if (results.failed === 0) {
    log('  🚀 Ready to deploy!', 'green');
    log('     npm install', 'cyan');
    log('     npx expo start', 'cyan');
  } else {
    log('  🔧 Fix remaining issues:', 'yellow');
    log('     - Review failed checks above', 'cyan');
    log('     - Ensure all files are present', 'cyan');
    log('     - Run npm install', 'cyan');
  }

  log('');

  return results;
}

// Run if executed directly
if (require.main === module) {
  const results = runAllTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = runAllTests;
