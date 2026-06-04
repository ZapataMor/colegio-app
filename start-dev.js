#!/usr/bin/env node

/**
 * Script para iniciar Backend y Frontend simultáneamente
 * Uso: npm run dev:all
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';

console.log('🚀 Iniciando Colegio App (Backend + Frontend)...\n');

// Backend
const backendDir = path.join(__dirname, 'backend');
const backendCmd = isWindows ? 'npm.cmd' : 'npm';
const backend = spawn(backendCmd, ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

console.log('📱 Backend iniciándose en http://localhost:3001\n');

// Esperar 3 segundos antes de iniciar frontend
setTimeout(() => {
  const frontendDir = path.join(__dirname, 'frontend');
  const frontendCmd = isWindows ? 'npm.cmd' : 'npm';
  const frontend = spawn(frontendCmd, ['start'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
  });

  console.log('🌐 Frontend iniciándose en http://localhost:8081\n');

  frontend.on('error', (err) => {
    console.error('Error iniciando frontend:', err);
    process.exit(1);
  });
}, 3000);

backend.on('error', (err) => {
  console.error('Error iniciando backend:', err);
  process.exit(1);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n⛔ Deteniendo servicios...');
  backend.kill();
  process.exit(0);
});
