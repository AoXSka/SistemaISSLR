#!/usr/bin/env node

// ContaVe Pro - Pre-build validation script
// Ensures all requirements are met before Electron build

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-build validation...');

// Check that dist directory exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check that dist/index.html exists
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.html not found. Vite build may have failed.');
  process.exit(1);
}

// Check that main.cjs exists
const mainPath = path.join(__dirname, '..', 'electron', 'main.cjs');
if (!fs.existsSync(mainPath)) {
  console.error('❌ ERROR: electron/main.cjs not found.');
  process.exit(1);
}

// Check that preload.cjs exists
const preloadPath = path.join(__dirname, '..', 'electron', 'preload.cjs');
if (!fs.existsSync(preloadPath)) {
  console.error('❌ ERROR: electron/preload.cjs not found.');
  process.exit(1);
}

console.log('✅ Pre-build validation passed');
console.log('✅ dist/index.html exists');
console.log('✅ electron/main.cjs exists');
console.log('✅ electron/preload.cjs exists');

// Success
process.exit(0);