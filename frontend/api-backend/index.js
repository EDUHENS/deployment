// Vercel serverless function wrapper for Express backend
const path = require('path');

const candidatePaths = [
  path.join(__dirname, '../../backend/src/app.js'), // local dev
  path.join(__dirname, '../.backend/src/app.js'),   // copied for builds
  path.join(process.cwd(), '.backend/src/app.js'),
];

let loadedApp;
let lastError;
for (const candidate of candidatePaths) {
  try {
    loadedApp = require(candidate);
    break;
  } catch (error) {
    lastError = error;
  }
}

if (!loadedApp) {
  console.error('[api/index] Failed to load backend app. Tried paths:', candidatePaths);
  throw lastError;
}

module.exports = loadedApp;

