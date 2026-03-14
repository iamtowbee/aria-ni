const fs = require('fs');
const path = require('path');

console.log('=== BUILD VALIDATION ===\n');

let errors = 0;
let warnings = 0;

// Check 1: Required files
console.log('1. Checking required files...');
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'babel.config.js',
  'app.json',
  'App.tsx'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} MISSING`);
    errors++;
  }
});

// Check 2: Source directories
console.log('\n2. Checking source directories...');
const requiredDirs = [
  'src/agents',
  'src/services',
  'src/components',
  'src/screens',
  'src/providers',
  'src/features',
  'src/utils'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log(`   ✓ ${dir} (${files.length} files)`);
  } else {
    console.log(`   ⚠ ${dir} missing`);
    warnings++;
  }
});

// Check 3: TypeScript files
console.log('\n3. Checking TypeScript files...');
function countFiles(dir, ext) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      count += countFiles(fullPath, ext);
    } else if (file.endsWith(ext)) {
      count++;
    }
  });
  return count;
}

const tsCount = countFiles('src', '.ts');
const tsxCount = countFiles('src', '.tsx');
console.log(`   TypeScript files: ${tsCount}`);
console.log(`   TSX files: ${tsxCount}`);
console.log(`   Total: ${tsCount + tsxCount}`);

// Check 4: Package.json validity
console.log('\n4. Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   ✓ Valid JSON`);
  console.log(`   ✓ Name: ${pkg.name}`);
  console.log(`   ✓ Version: ${pkg.version}`);
  
  const deps = Object.keys(pkg.dependencies || {});
  console.log(`   ✓ Dependencies: ${deps.length}`);
  
  // Check critical deps
  const critical = ['expo', 'react', 'react-native'];
  critical.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`   ✓ ${dep}: ${pkg.dependencies[dep]}`);
    } else {
      console.log(`   ✗ ${dep} missing`);
      errors++;
    }
  });
} catch (err) {
  console.log(`   ✗ Invalid package.json: ${err.message}`);
  errors++;
}

// Check 5: New features
console.log('\n5. Checking v2.0 features...');
const v2Features = [
  'src/utils/performance.ts',
  'src/features/theme/ThemeSystem.ts',
  'src/features/analytics/AnalyticsSystem.ts',
  'src/features/gamification/AchievementSystem.ts',
  'src/features/export/ConversationExporter.ts'
];

v2Features.forEach(file => {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    console.log(`   ✓ ${path.basename(file)} (${Math.round(size/1024)}KB)`);
  } else {
    console.log(`   ✗ ${path.basename(file)} missing`);
    errors++;
  }
});

// Summary
console.log('\n=== VALIDATION SUMMARY ===');
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors === 0 && warnings === 0) {
  console.log('\n✅ BUILD READY - All checks passed!');
  process.exit(0);
} else if (errors === 0) {
  console.log('\n⚠️  BUILD READY - Minor warnings only');
  process.exit(0);
} else {
  console.log('\n❌ BUILD NOT READY - Fix errors first');
  process.exit(1);
}
