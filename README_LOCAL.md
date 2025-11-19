# Local Development Setup

## Prerequisites
- Node.js 18+ installed
- npm or yarn installed

## Quick Start

### 1. Install all dependencies
```bash
npm install
```

This will automatically install both frontend and backend dependencies.

### 2. Set up environment variables

#### Backend (.env in `backend/` folder)
```bash
# Database
DATABASE_URL=your_supabase_connection_string
# OR individual DB vars:
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth0
AUTH0_DOMAIN=dev-lrhaxesvwpyqa5me.us.auth0.com
AUTH0_AUDIENCE=https://api.eduhens.reset
AUTH0_CLIENT_ID=9gHJBpgKtFnXQ8UMPxPFdw3cLeDR81oL
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_BASE_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=5001
```

#### Frontend (.env.local in `frontend/` folder)
```bash
# Auth0 (required by @auth0/nextjs-auth0)
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://dev-lrhaxesvwpyqa5me.us.auth0.com
AUTH0_CLIENT_ID=9gHJBpgKtFnXQ8UMPxPFdw3cLeDR81oL
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://api.eduhens.reset
AUTH0_SCOPE=openid profile email offline_access read:users write:users read:tasks write:tasks

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001

# App Base URL
APP_BASE_URL=http://localhost:3000
```

### 3. Run both frontend and backend together
```bash
npm run dev
```

This will start:
- Backend on http://localhost:5001
- Frontend on http://localhost:3000

### 4. Or run them separately

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

## Troubleshooting

### Auth0 Callback URL Mismatch
- Ensure `AUTH0_BASE_URL=http://localhost:3000` is set in both frontend `.env.local` and backend `.env`
- The callback URL `http://localhost:3000/api/auth/callback` must be in your Auth0 Application settings
- Check that you're accessing the app at exactly `http://localhost:3000` (not `http://127.0.0.1:3000` unless that's also configured)

### Backend not responding
- Make sure backend is running on port 5001
- Check backend `.env` file has correct DATABASE_URL or DB_* variables
- Verify `NEXT_PUBLIC_BACKEND_URL=http://localhost:5001` in frontend `.env.local`

### Database connection issues
- Verify DATABASE_URL is correct for Supabase
- Check that SUPABASE_SERVICE_ROLE_KEY is set for file uploads
- Ensure database is accessible from your IP (Supabase might have IP restrictions)

## Available Scripts

- `npm run dev` - Run both frontend and backend in development mode
- `npm run dev:frontend` - Run only frontend (port 3000)
- `npm run dev:backend` - Run only backend (port 5001)
- `npm run build` - Build both frontend and backend for production
- `npm run start:frontend` - Run frontend in production mode (requires build first)
- `npm run start:backend` - Run backend in production mode

