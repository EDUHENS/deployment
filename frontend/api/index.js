// Vercel serverless function wrapper for Express backend (frontend root)
// This allows the Next.js app (rooted in `frontend/`) to share the same
// domain with the Express API mounted under `/api/*`.

const app = require('../../backend/src/app');

module.exports = app;


