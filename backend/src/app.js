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
console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN ? 'set' : 'notset');
console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'notset');
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
// CORS configuration - allow all Vercel preview deployments
const allowedOrigins = [
  'http://localhost:3000',  
  'http://localhost:5173',
  'https://deployment-frontend-mzzh.onrender.com',
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_BACKEND_URL,
  process.env.APP_BASE_URL,
  /\.onrender\.com$/,
  /\.vercel\.app$/
].filter(Boolean);


// Add Vercel preview URL patterns
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check Vercel preview patterns
    if (
      /^https:\/\/.*\.vercel\.app$/.test(origin) ||
      /^https:\/\/.*-.*-.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    
    // Allow eduhens domains
    if (/^https:\/\/.*\.eduhens\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins for now - tighten in production
  },
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
