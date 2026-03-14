const fs = require('fs');
const path = require('path');

console.log('=== VALIDATING TYPESCRIPT FILES ===\n');

let errors = [];
let warnings = [];
let fileCount = 0;

// Recursively find all TS/TSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Validate a single file
function validateFile(filePath) {
  fileCount++;
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Check 1: React import in TSX files
  if (filePath.endsWith('.tsx') && content.includes('React') && !content.includes('import React')) {
    errors.push(`${fileName}: Missing React import`);
  }
  
  // Check 2: Unclosed brackets/braces
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`${fileName}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
  }
  
  // Check 3: Unclosed parentheses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`${fileName}: Mismatched parentheses (${openParens} open, ${closeParens} close)`);
  }
  
  // Check 4: Basic import syntax
  const importLines = content.match(/import .+ from ['"].+['"]/g) || [];
  importLines.forEach(line => {
    if (!line.endsWith(';') && !line.includes('\n')) {
      warnings.push(`${fileName}: Import missing semicolon: ${line.substring(0, 50)}`);
    }
  });
  
  // Check 5: Export syntax
  if (content.includes('export') && !content.match(/export (default |const |function |interface |enum |type )/)) {
    warnings.push(`${fileName}: Unusual export syntax detected`);
  }
}

// Run validation
const files = findFiles('src');
console.log(`Found ${files.length} TypeScript files\n`);

files.forEach(file => {
  try {
    validateFile(file);
  } catch (err) {
    errors.push(`${file}: Failed to parse - ${err.message}`);
  }
});

// Report results
console.log('=== VALIDATION RESULTS ===\n');
console.log(`Files checked: ${fileCount}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS:\n');
  errors.forEach(err => console.log(`  • ${err}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.slice(0, 10).forEach(warn => console.log(`  • ${warn}`));
  if (warnings.length > 10) {
    console.log(`  ... and ${warnings.length - 10} more warnings`);
  }
}

if (errors.length === 0) {
  console.log('\n✅ No critical errors found!');
}

process.exit(errors.length > 0 ? 1 : 0);
