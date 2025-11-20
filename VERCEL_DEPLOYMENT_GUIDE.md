# Complete Vercel Deployment Guide

This guide will help you deploy both the backend and frontend to Vercel from scratch.

## Prerequisites

- GitHub repository: https://github.com/EDUHENS/deployment.git
- Vercel account (logged in)
- Environment variables ready (see below)

## Step 1: Deploy Backend

### 1.1 Create Backend Project in Vercel

1. Go to https://vercel.com/new
2. Import Git Repository: Select `EDUHENS/deployment`
3. Configure Project:
   - **Project Name**: `eduhens-api` (or your preferred name)
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `cd backend && npm install`
   - **Development Command**: `cd backend && npm run dev`

4. Click "Deploy"

### 1.2 Configure Backend Environment Variables

After deployment, go to: **Project Settings → Environment Variables**

Add these variables for **Production, Preview, and Development**:

```bash
# Database
DATABASE_URL=postgresql://postgres.pehimhjaimqfmzltmhmx:As8SAjjdWBV4*3N@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://pehimhjaimqfmzltmhmx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

# Auth0
AUTH0_DOMAIN=dev-lrhaxesvwpyqa5me.us.auth0.com
AUTH0_AUDIENCE=https://api.eduhens.reset

# OpenAI (if using AI features)
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

# App Config
NODE_ENV=production
AI_AUTOGRADE=1
PORT=5001
```

**Important**: Replace `<YOUR_SUPABASE_SERVICE_ROLE_KEY>` and `<YOUR_OPENAI_API_KEY>` with actual values from your local `.env` files.

### 1.3 Redeploy Backend

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

### 1.4 Get Backend URL

After redeployment, copy the deployment URL (e.g., `https://eduhens-api.vercel.app` or `https://eduhens-api-xxx.vercel.app`)

---

## Step 2: Deploy Frontend

### 2.1 Create Frontend Project in Vercel

1. Go to https://vercel.com/new
2. Import Git Repository: Select `EDUHENS/deployment` (same repo)
3. Configure Project:
   - **Project Name**: `eduhens` (or your preferred name)
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `cd frontend && npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `cd frontend && npm install`
   - **Development Command**: `cd frontend && npm run dev`

4. Click "Deploy"

### 2.2 Configure Frontend Environment Variables

After deployment, go to: **Project Settings → Environment Variables**

Add these variables for **Production, Preview, and Development**:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=dev-lrhaxesvwpyqa5me.us.auth0.com
AUTH0_CLIENT_ID=9gHJBpgKtFnXQ8UMPxPFdw3cLeDR81oL
AUTH0_CLIENT_SECRET=zhF3QxzzoisdZl_OwWaUYWf4tCTreHMtZGKJx6oCKwFJtgm0nPmxlMg4noIHq6gF
AUTH0_SECRET=67c0bac0916b09d1394f96ff149ebfea4e495437b242df75e7a9058de4253b27
AUTH0_AUDIENCE=https://api.eduhens.reset
AUTH0_SCOPE=openid profile email offline_access read:users write:users read:tasks write:tasks
AUTH0_ISSUER_BASE_URL=https://dev-lrhaxesvwpyqa5me.us.auth0.com

# Backend URL (IMPORTANT: Use the backend URL from Step 1.4)
NEXT_PUBLIC_BACKEND_URL=https://eduhens-api.vercel.app

# App URLs (Update with your actual frontend URL after first deployment)
AUTH0_BASE_URL=https://eduhens.vercel.app
APP_BASE_URL=https://eduhens.vercel.app
NEXT_PUBLIC_API_URL=https://eduhens.vercel.app

# Database (optional, for direct Supabase access if needed)
DATABASE_URL=postgresql://postgres.pehimhjaimqfmzltmhmx:As8SAjjdWBV4*3N@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://pehimhjaimqfmzltmhmx.supabase.co

# Optional
NODE_ENV=production
AI_AUTOGRADE=1
```

**Important**: 
- Replace `https://eduhens-api.vercel.app` with your actual backend URL from Step 1.4
- After first deployment, update `AUTH0_BASE_URL` and `APP_BASE_URL` with your actual frontend URL

### 2.3 Update Auth0 Settings

Go to: https://manage.auth0.com/dashboard/us/dev-lrhaxesvwpyqa5me/applications

Find your application and update:

**Allowed Callback URLs:**
```
https://eduhens.vercel.app/api/auth/callback
https://*.vercel.app/api/auth/callback
http://localhost:3000/api/auth/callback
```

**Allowed Logout URLs:**
```
https://eduhens.vercel.app
https://*.vercel.app
http://localhost:3000
```

**Allowed Web Origins:**
```
https://eduhens.vercel.app
https://*.vercel.app
http://localhost:3000
```

### 2.4 Update Backend CORS

After you have the frontend URL, update the backend CORS settings:

1. Go to backend project settings
2. Add environment variable:
   ```
   FRONTEND_URL=https://eduhens.vercel.app
   ```
3. Redeploy backend

### 2.5 Redeploy Frontend

After adding all environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

---

## Step 3: Verify Deployment

### 3.1 Test Backend

Visit: `https://your-backend-url.vercel.app/api/health`

Should return: `{"ok":true}`

### 3.2 Test Database Connection

Visit: `https://your-backend-url.vercel.app/api/db-connect`

Should return database connection info.

### 3.3 Test Frontend

1. Visit your frontend URL
2. Try logging in with Auth0
3. Check browser console for any errors
4. Verify backend API calls are working

---

## Troubleshooting

### Backend Issues

- **502 Bad Gateway**: Check environment variables, especially `DATABASE_URL`
- **CORS errors**: Verify `FRONTEND_URL` is set in backend env vars
- **Database connection fails**: Check `DATABASE_URL` format and Supabase credentials

### Frontend Issues

- **Auth0 errors**: Verify all `AUTH0_*` variables are set correctly
- **Backend not reachable**: Check `NEXT_PUBLIC_BACKEND_URL` matches backend deployment URL
- **Build fails**: Check `package.json` scripts and dependencies

### Common Fixes

1. **Redeploy after env var changes**: Always redeploy after adding/updating environment variables
2. **Check logs**: Use Vercel dashboard → Deployments → View Function Logs
3. **Verify URLs**: Ensure all URLs use `https://` and match exactly

---

## Quick Reference

- **Backend Project**: https://vercel.com/[your-team]/eduhens-api
- **Frontend Project**: https://vercel.com/[your-team]/eduhens
- **Auth0 Dashboard**: https://manage.auth0.com/dashboard/us/dev-lrhaxesvwpyqa5me/applications
- **Supabase Dashboard**: https://supabase.com/dashboard/project/pehimhjaimqfmzltmhmx

---

## Next Steps

After successful deployment:
1. Set up custom domains (optional)
2. Configure monitoring and alerts
3. Set up CI/CD (already done via Git integration)
4. Review and optimize performance

