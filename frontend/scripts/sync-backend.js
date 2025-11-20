#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const sourceDir = path.resolve(frontendRoot, '..', 'backend');
const targetDir = path.join(frontendRoot, '.backend');
const sourceSrc = path.join(sourceDir, 'src');

if (!fs.existsSync(sourceSrc)) {
  console.warn('[sync-backend] Could not find backend/src at', sourceSrc);
  console.warn('[sync-backend] This is OK if backend is deployed separately.');
  console.warn('[sync-backend] Frontend will use NEXT_PUBLIC_BACKEND_URL instead.');
  // Don't exit - this is OK when backend is deployed separately
  process.exit(0);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

const copyRecursive = (src, dest) => {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry === 'node_modules' || entry.startsWith('.env')) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
};

copyRecursive(sourceSrc, path.join(targetDir, 'src'));

const filesToCopy = ['package.json'];
for (const file of filesToCopy) {
  const srcFile = path.join(sourceDir, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(targetDir, file));
  }
}

console.log('[sync-backend] Copied backend/src into frontend/.backend');
