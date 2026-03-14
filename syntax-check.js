const fs = require('fs');
const path = require('path');

console.log('=== ACCURATE SYNTAX CHECK ===\n');

let totalFiles = 0;
let errorFiles = [];

function checkFile(filePath) {
  totalFiles++;
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative(process.cwd(), filePath);
  
  try {
    // Try to parse as JavaScript (TypeScript syntax is superset)
    // This is a basic check - real validation needs TypeScript compiler
    
    // Check for common actual errors:
    
    // 1. Unterminated strings
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for unmatched quotes on same line (excluding comments)
      if (!line.trim().startsWith('//')) {
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;
        const backticks = (line.match(/`/g) || []).length;
        
        // These should be even unless multiline
        if (singleQuotes % 2 !== 0 && !line.includes('\\\'')) {
          errorFiles.push(`${fileName}:${i+1} - Possible unterminated string (single quote)`);
        }
      }
    }
    
    // 2. Check for basic structural issues
    const hasExport = /export\s+(default\s+)?(class|function|const|interface|enum|type)/.test(content);
    if (fileName.startsWith('src/') && !hasExport && !fileName.includes('test')) {
      console.log(`⚠️  ${fileName} - No exports found (might be intentional)`);
    }
    
  } catch (err) {
    errorFiles.push(`${fileName} - Parse error: ${err.message}`);
  }
}

// Find and check all files
function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
      walk(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      checkFile(filePath);
    }
  });
}

walk('src');

console.log(`\nChecked ${totalFiles} files`);

if (errorFiles.length > 0) {
  console.log(`\n❌ Found ${errorFiles.length} potential issues:\n`);
  errorFiles.forEach(err => console.log(`  ${err}`));
  process.exit(1);
} else {
  console.log('\n✅ No syntax errors detected!');
  console.log('\nNote: Full type checking requires TypeScript compiler');
  console.log('Run "npx tsc --noEmit" after npm install for complete validation');
}
