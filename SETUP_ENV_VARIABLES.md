# Environment Variables Setup for Vercel

## Backend Project: `eduhens/backend`
**URL**: https://backend-jlsrd6c1n-eduhens.vercel.app (or check your Vercel dashboard)

### Step 1: Go to Backend Project Settings
1. Visit: https://vercel.com/eduhens/backend/settings/environment-variables
2. Or navigate: Vercel Dashboard → `backend` project → Settings → Environment Variables

### Step 2: Add These Variables

Click "Add New" for each variable and select **Production, Preview, and Development** for each:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres.pehimhjaimqfmzltmhmx:As8SAjjdWBV4*3N@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://pehimhjaimqfmzltmhmx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<GET_FROM_YOUR_LOCAL_BACKEND/.env_FILE>

# Auth0
AUTH0_DOMAIN=dev-lrhaxesvwpyqa5me.us.auth0.com
AUTH0_AUDIENCE=https://api.eduhens.reset

# OpenAI (if using AI features)
OPENAI_API_KEY=<GET_FROM_YOUR_LOCAL_BACKEND/.env_FILE>

# App Config
NODE_ENV=production
AI_AUTOGRADE=1
PORT=5001

# Frontend URL (update after frontend is deployed)
FRONTEND_URL=https://frontend-31ij0onpq-eduhens.vercel.app
```

**Important**: 
- Replace `<GET_FROM_YOUR_LOCAL_BACKEND/.env_FILE>` with actual values from your local `backend/.env` file
- Update `FRONTEND_URL` after frontend deployment completes

### Step 3: Redeploy Backend
After adding all variables:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

---

## Frontend Project: `eduhens/frontend`
**URL**: https://frontend-31ij0onpq-eduhens.vercel.app (or check your Vercel dashboard)

### Step 1: Go to Frontend Project Settings
1. Visit: https://vercel.com/eduhens/frontend/settings/environment-variables
2. Or navigate: Vercel Dashboard → `frontend` project → Settings → Environment Variables

### Step 2: Add These Variables

Click "Add New" for each variable and select **Production, Preview, and Development** for each:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=dev-lrhaxesvwpyqa5me.us.auth0.com
AUTH0_CLIENT_ID=9gHJBpgKtFnXQ8UMPxPFdw3cLeDR81oL
AUTH0_CLIENT_SECRET=zhF3QxzzoisdZl_OwWaUYWf4tCTreHMtZGKJx6oCKwFJtgm0nPmxlMg4noIHq6gF
AUTH0_SECRET=67c0bac0916b09d1394f96ff149ebfea4e495437b242df75e7a9058de4253b27
AUTH0_AUDIENCE=https://api.eduhens.reset
AUTH0_SCOPE=openid profile email offline_access read:users write:users read:tasks write:tasks
AUTH0_ISSUER_BASE_URL=https://dev-lrhaxesvwpyqa5me.us.auth0.com

# Backend URL (IMPORTANT: Use your actual backend URL)
NEXT_PUBLIC_BACKEND_URL=https://backend-jlsrd6c1n-eduhens.vercel.app

# App URLs (Update with your actual frontend URL after first deployment)
AUTH0_BASE_URL=https://frontend-31ij0onpq-eduhens.vercel.app
APP_BASE_URL=https://frontend-31ij0onpq-eduhens.vercel.app
NEXT_PUBLIC_API_URL=https://frontend-31ij0onpq-eduhens.vercel.app

# Database (optional, for direct Supabase access if needed)
DATABASE_URL=postgresql://postgres.pehimhjaimqfmzltmhmx:As8SAjjdWBV4*3N@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://pehimhjaimqfmzltmhmx.supabase.co

# Optional
NODE_ENV=production
AI_AUTOGRADE=1
```

**Important**: 
- Update `NEXT_PUBLIC_BACKEND_URL` with your actual backend URL (check Vercel dashboard)
- After first deployment, update `AUTH0_BASE_URL` and `APP_BASE_URL` with your actual frontend URL

### Step 3: Update Auth0 Settings

Go to: https://manage.auth0.com/dashboard/us/dev-lrhaxesvwpyqa5me/applications

Find your application (Client ID: `9gHJBpgKtFnXQ8UMPxPFdw3cLeDR81oL`) and update:

**Allowed Callback URLs:**
```
https://frontend-31ij0onpq-eduhens.vercel.app/api/auth/callback
https://*.vercel.app/api/auth/callback
http://localhost:3000/api/auth/callback
```

**Allowed Logout URLs:**
```
https://frontend-31ij0onpq-eduhens.vercel.app
https://*.vercel.app
http://localhost:3000
```

**Allowed Web Origins:**
```
https://frontend-31ij0onpq-eduhens.vercel.app
https://*.vercel.app
http://localhost:3000
```

### Step 4: Redeploy Frontend
After adding all variables:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

---

## Verification Steps

### 1. Test Backend
```bash
curl https://backend-jlsrd6c1n-eduhens.vercel.app/api/health
# Should return: {"ok":true}
```

### 2. Test Database Connection
```bash
curl https://backend-jlsrd6c1n-eduhens.vercel.app/api/db-connect
# Should return database connection info
```

### 3. Test Frontend
1. Visit: https://frontend-31ij0onpq-eduhens.vercel.app
2. Try logging in with Auth0
3. Check browser console for errors
4. Verify API calls are working

---

## Troubleshooting

### Backend returns 502/500
- Check environment variables are set correctly
- Verify `DATABASE_URL` is correct
- Check deployment logs in Vercel dashboard

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_BACKEND_URL` matches backend URL exactly
- Check CORS settings in backend
- Verify `FRONTEND_URL` is set in backend env vars

### Auth0 errors
- Verify all `AUTH0_*` variables are set
- Check Auth0 dashboard callback URLs match frontend URL
- Ensure `AUTH0_SECRET` is set (required for Next.js Auth0 SDK)

---

## Quick Links

- **Backend Project**: https://vercel.com/eduhens/backend
- **Frontend Project**: https://vercel.com/eduhens/frontend
- **Auth0 Dashboard**: https://manage.auth0.com/dashboard/us/dev-lrhaxesvwpyqa5me/applications
- **Supabase Dashboard**: https://supabase.com/dashboard/project/pehimhjaimqfmzltmhmx

