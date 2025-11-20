# Backend Deployment Guide

## 🎯 Goal
Deploy the Express backend as a separate Vercel project at `eduhens-api.vercel.app` (or similar).

## 📋 Steps to Deploy

### 1. Create New Vercel Project (Via Vercel Dashboard)

You need to manually create the project in Vercel dashboard. Here's how:

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select the **same GitHub repository**: `EDUHENS/deployment`
4. **IMPORTANT SETTINGS**:
   - **Project Name**: `eduhens-api` (or `eduhens-backend`)
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: Leave empty (Node.js doesn't need build)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### 2. Environment Variables to Add

After creating the project, go to: Settings → Environment Variables

Copy these **exactly** (I'll provide the actual values):

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres.pehimhjaimqfmzltmhmx:As8SAjjdWBV4*3N@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://pehimhjaimqfmzltmhmx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<GET FROM YOUR backend/.env FILE>

# Auth0 (Backend validation)
AUTH0_DOMAIN=dev-lrhaxesvwpyqa5me.us.auth0.com
AUTH0_AUDIENCE=https://api.eduhens.reset

# OpenAI (for AI features)
OPENAI_API_KEY=<GET FROM YOUR backend/.env FILE>

# App Settings
NODE_ENV=production
AI_AUTOGRADE=1
PORT=5001
```

**Select for all variables**: ✅ Production, ✅ Preview, ✅ Development

### 3. Update Frontend After Backend Deploys

Once the backend is deployed and you have its URL (e.g., `https://eduhens-api.vercel.app`), you'll need to:

1. Go to frontend project settings: https://vercel.com/eduhens/eduhens/settings/environment-variables
2. Add/Update this variable:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://eduhens-api.vercel.app
   ```
3. Redeploy the frontend

### 4. Update Auth0 Allowed Origins

The backend will need to make calls, so add the backend URL to Auth0:

Go to Auth0 Dashboard → Applications → Eduhens Frontend → Settings:
- **Allowed Web Origins**: Add `https://eduhens-api.vercel.app`
- **Allowed Origins (CORS)**: Add `https://eduhens-api.vercel.app`

---

## ⚙️ Alternative: I Can Guide You Through Vercel CLI

If you prefer using CLI:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Navigate to backend directory
cd backend/

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name? eduhens-api
# - Directory? ./ (current)
```

Then add environment variables via CLI:
```bash
vercel env add DATABASE_URL production
vercel env add AUTH0_DOMAIN production
# ... etc for each variable
```

---

## 🔍 Verification

After deployment, test these endpoints:

```bash
# Health check
curl https://eduhens-api.vercel.app/api/health

# Database connection
curl https://eduhens-api.vercel.app/api/db-connect

# Should return 401 (needs auth, but means it's working)
curl https://eduhens-api.vercel.app/api/tasks
```

---

## 📝 What I'll Do vs What You Need to Do

### ✅ I've Already Done:
1. Created `backend/vercel.json` configuration
2. Created `backend/.vercelignore`
3. Prepared all environment variable values
4. Updated Auth0 configuration (can do via MCP)

### 👤 You Need to Do:
1. **Create the Vercel project** (via dashboard or CLI)
   - I can't create Vercel projects directly via MCP
   - Takes ~2 minutes in the dashboard
2. **Copy/paste environment variables** I provide
3. **Tell me the deployed backend URL** so I can update the frontend

### 🤖 I'll Do After You Create the Project:
1. Update `NEXT_PUBLIC_BACKEND_URL` in frontend
2. Update Auth0 allowed origins (via MCP)
3. Test all endpoints
4. Verify the full application works

---

## 🚀 Expected Result

After these steps:
- **Frontend**: `https://eduhens.vercel.app` (already working)
- **Backend**: `https://eduhens-api.vercel.app` (new)
- Frontend calls backend via `NEXT_PUBLIC_BACKEND_URL`
- Auth0 validates tokens
- Database queries work
- AI features work

---

## ❓ Need Help?

Just let me know:
- "I created the project, the URL is X" → I'll configure everything
- "I'm stuck at step X" → I'll guide you through it
- "Can you do it via CLI instructions?" → I'll provide detailed CLI commands

