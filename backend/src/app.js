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
  origin: [ 
    'http://localhost:3000',  
    'http://localhost:5173',
    'https://deployment-git-main-eduhens.vercel.app',
    /^https:\/\/deployment-.*-eduhens\.vercel\.app$/,
    /^https:\/\/.*\.eduhens\.vercel\.app$/
  ], 
  credentials: true })); 
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
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
const tasksRoute = require('./routes/tasksRoute')(requireAuth);
const tasksAiRoute = require('./routes/tasksAiRoute')(requireAuth);
const enrollRoute = require('./routes/enrollRoute')(requireAuth);
const submissionsRoute = require('./routes/submissionsRoute')(requireAuth);
const submissionsAiRoute = require('./routes/submissionsAiRoute')(requireAuth);

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
app.use('/api/tasks', tasksRoute);
app.use('/api/tasks/ai', tasksAiRoute);
app.use('/api/enroll', enrollRoute);
app.use('/api/submissions', submissionsRoute);
app.use('/api/submissions/ai', submissionsAiRoute);

// Initialize database connection
connectDB().then(() => {
  console.log('Database connected successfully');
}).catch(error => {
  console.error('Database connection error:', error);
});

// For local development only
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    const dbUrl = process.env.DATABASE_URL || `${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'Eduhens'}`;
    const isSupabase = dbUrl.includes('supabase.com') || dbUrl.includes('aws-');
    console.log(`Database: ${isSupabase ? '✅ Supabase' : '⚠️  Local'} (${dbUrl.replace(/:[^:@]+@/, ':****@')})`);
  });
}

module.exports = app;
