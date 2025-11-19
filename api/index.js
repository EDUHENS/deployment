// Legacy wrapper (not used now that project root is `frontend/`).
// The active serverless entrypoint is `frontend/api/index.js`.

const app = require('../backend/src/app');

module.exports = app;

