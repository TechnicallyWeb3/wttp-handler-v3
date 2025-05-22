#!/usr/bin/env node

// This script tests both ESM and CJS bundles

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Testing WTTP Handler Bundles\n');

// Test ESM bundle
console.log('Testing ESM bundle...');
try {
  const result = execSync('node wttp-example-esm.js', { encoding: 'utf8' });
  console.log(result);
  console.log('✅ ESM bundle test passed!\n');
} catch (error) {
  console.error('❌ ESM bundle test failed!');
  console.error(error.stdout || error.message);
  process.exit(1);
}

// Create a temporary package.json without "type": "module"
console.log('Testing CJS bundle...');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const originalType = packageJson.type;

// Backup the original package.json
fs.writeFileSync(`${packageJsonPath}.bak`, JSON.stringify(packageJson, null, 2));

// Remove the "type": "module" for CJS testing
delete packageJson.type;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

try {
  const result = execSync('node wttp-example-cjs.cjs', { encoding: 'utf8' });
  console.log(result);
  console.log('✅ CJS bundle test passed!');
} catch (error) {
  console.error('❌ CJS bundle test failed!');
  console.error(error.stdout || error.message);
} finally {
  // Restore the original package.json
  packageJson.type = originalType;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  fs.unlinkSync(`${packageJsonPath}.bak`);
}