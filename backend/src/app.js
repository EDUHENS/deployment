// backend/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
//database 
const { connectDB } = require('./database/index.js');
// monitor error
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
//import auth0
const { auth } = require('express-oauth2-jwt-bearer');

const app = express();

app.use(helmet());
//app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cors({ 
  origin: [ 'http://localhost:3000',  'http://localhost:5173'], 
  credentials: true })); 
app.use(express.json());
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

//auth0
let requireAuth = (_req, _res, next) => next()

if (process.env.AUTH0_AUDIENCE && process.env.AUTH0_DOMAIN) {
  console.log('[Auth0] Enabling JWT validation middleware');
  console.log('[Auth0] issuerBaseURL = https://%s/', (process.env.AUTH0_DOMAIN || '').trim());
  console.log('[Auth0] audience     = %s', (process.env.AUTH0_AUDIENCE || '').trim());
  requireAuth = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256',
  })
} else {
  console.warn('[Auth0] AUTH0_AUDIENCE or AUTH0_DOMAIN not set. requireAuth is NO-OP.');
}

//auth0
/*
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256',
});
*/ 
const auth0Route = require('./routes/auth0Route')(requireAuth);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

//old code
/*
app.get('/api/secure', requireAuth, (req, res) => {
  res.json({ ok: true, sub: req.auth.payload.sub });
});
*/
app.get('/api/db-connect', async (_req, res) => {
  try {
    const { pool } = require('./database/index');
    const result = await pool.query('SELECT current_database(), now() as time');
    res.json({ 
      ok: true, 
      database: result.rows[0].current_database,
      time: result.rows[0].time
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
//get me from routes
app.use('/api/auth', auth0Route);

const initializeApp = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Failed to connect to database.');
    process.exit(1);
  }
  console.log('Database connected successfully');
  const PORT = process.env.PORT || 5001;
  console.log(`Starting server on port ${PORT}...`);
  
  const server = app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`Connected to database: ${process.env.DB_NAME}`);
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
  
  return server; 
};
initializeApp().catch(error => {
  console.error('Initialization error:', error);
  process.exit(1);
}); 
//const PORT = process.env.PORT || 5001;

/*
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
*/


module.exports = app;
