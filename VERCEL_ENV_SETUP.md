# Vercel Environment Variables Setup

## Required Environment Variables

These environment variables need to be set in your Vercel project dashboard:
https://vercel.com/eduhens/deployment/settings/environment-variables

### Auth0 Configuration
```
AUTH0_DOMAIN=<your-auth0-domain>.auth0.com
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
AUTH0_SECRET=<generate-random-32-char-string>
AUTH0_AUDIENCE=https://api.eduhens.com
AUTH0_SCOPE=openid profile email offline_access
AUTH0_BASE_URL=https://deployment-eduhens.vercel.app
APP_BASE_URL=https://deployment-eduhens.vercel.app
```

### Database Configuration (Supabase)
```
DATABASE_URL=<your-supabase-connection-string>
```

### Backend URL
```
NEXT_PUBLIC_BACKEND_URL=https://deployment-eduhens.vercel.app
```

## How to Set Environment Variables on Vercel

1. Go to https://vercel.com/eduhens/deployment/settings/environment-variables
2. For each variable:
   - Enter the **Name** (e.g., `AUTH0_DOMAIN`)
   - Enter the **Value**
   - Select **Production**, **Preview**, and **Development** environments
   - Click **Save**

## Auth0 Callback URLs to Configure

In your Auth0 Application Settings (https://manage.auth0.com), set these URLs:

### Allowed Callback URLs:
```
https://deployment-eduhens.vercel.app/api/auth/callback
https://*.vercel.app/api/auth/callback
http://localhost:3000/api/auth/callback
```

### Allowed Logout URLs:
```
https://deployment-eduhens.vercel.app
https://*.vercel.app
http://localhost:3000
```

### Allowed Web Origins:
```
https://deployment-eduhens.vercel.app
https://*.vercel.app
http://localhost:3000
```

## Vercel Project Settings

### Root Directory
Set to: `frontend`

### Build & Development Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (uses root package.json)
- **Install Command**: `npm install` (uses root package.json)
- **Output Directory**: `.next` (auto-detected)

## Notes

- The root `package.json` handles installing both frontend and backend dependencies
- The `frontend/api/index.js` file wraps the backend Express app as a Vercel serverless function
- The `vercel.json` in the frontend directory configures API routing
- Backend files are synced to `frontend/.backend` during build via the `sync-backend` script

