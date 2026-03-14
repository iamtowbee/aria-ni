const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Aria-Nova Setup...\n');

// Check critical files
const checks = [
  { file: 'package.json', desc: 'Package configuration' },
  { file: 'babel.config.js', desc: 'Babel configuration' },
  { file: 'App.tsx', desc: 'Application entry' },
  { file: 'tsconfig.json', desc: 'TypeScript config' },
  { file: 'src/agents/VisionAgent.ts', desc: 'Vision agent' },
  { file: 'src/agents/OCRAgent.ts', desc: 'OCR agent' },
];

let allGood = true;

checks.forEach(check => {
  if (fs.existsSync(check.file)) {
    console.log(`✓ ${check.desc}`);
  } else {
    console.log(`✗ ${check.desc} - MISSING`);
    allGood = false;
  }
});

// Check babel config
console.log('\n📝 Babel Configuration:');
const babel = fs.readFileSync('babel.config.js', 'utf8');
if (babel.includes("'react-native-reanimated/plugin'") && !babel.includes('//')) {
  console.log('⚠️  Reanimated plugin is active (may cause issues)');
} else {
  console.log('✓ Reanimated plugin disabled (safe)');
}

// Check package.json
console.log('\n📦 Dependencies:');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`✓ ${Object.keys(pkg.dependencies).length} dependencies`);
console.log(`✓ ${Object.keys(pkg.devDependencies).length} dev dependencies`);
console.log(`✓ Reanimated version: ${pkg.dependencies['react-native-reanimated']}`);

console.log('\n' + (allGood ? '✅ Setup Valid' : '⚠️  Some Issues Found'));
console.log('\nNext steps:');
console.log('1. npm install');
console.log('2. npx expo start');
