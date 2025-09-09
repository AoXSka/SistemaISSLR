#!/usr/bin/env node
// ContaVe Pro - Script de testing para módulos nativos

const path = require('path');
const fs = require('fs');

console.log('🧪 ContaVe Pro - Test de Módulos Nativos');
console.log('=====================================');

// Test 1: Verificar Node.js version
console.log('📋 Node.js version:', process.version);
console.log('📋 Platform:', process.platform, process.arch);

// Test 2: Verificar que better-sqlite3 existe
try {
  const sqlite3Path = require.resolve('better-sqlite3');
  console.log('✅ better-sqlite3 encontrado en:', sqlite3Path);
} catch (error) {
  console.log('❌ better-sqlite3 no encontrado:', error.message);
  process.exit(1);
}

// Test 3: Verificar que better-sqlite3 funciona
try {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  
  // Test básico de SQL
  const result = db.prepare('SELECT 1 as test').get();
  console.log('✅ better-sqlite3 funcional:', result);
  
  db.close();
} catch (error) {
  console.log('❌ better-sqlite3 falló al ejecutar:', error.message);
  process.exit(1);
}

// Test 4: Verificar Electron si está disponible
try {
  const electron = require('electron');
  console.log('✅ Electron disponible, version:', process.versions.electron);
} catch (error) {
  console.log('ℹ️  Electron no disponible (normal en Node.js directo)');
}

// Test 5: Verificar estructura de archivos
const requiredFiles = [
  'electron/main.js',
  'electron/preload.js', 
  'dist/index.html',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅ Archivo encontrado:', file);
  } else {
    console.log('❌ Archivo faltante:', file);
  }
});

console.log('');
console.log('🎯 Tests completados');
console.log('Si todos los tests pasaron, proceda con el build');