# ⚙️ Configure Backend Vercel Project Settings

## Problem
The backend deployment is showing "DEPLOYMENT_NOT_FOUND" which means the project settings need to be configured correctly.

## Solution: Check These Settings

### Go to: https://vercel.com/eduhens/eduhens-api/settings/general

### 1. Root Directory
**MUST be set to**: `backend`

If it's set to `./` or empty:
1. Click "Edit" next to Root Directory
2. Enter: `backend`
3. Click "Save"

### 2. Build & Development Settings

Should be:
```
Framework Preset: Other
Build Command: (leave empty)
Output Directory: (leave empty)
Install Command: npm install
Development Command: npm run dev
```

### 3. Node.js Version

Make sure it's set to a recent version (18.x or 20.x)

## After Fixing Settings

1. Go to **Deployments** tab
2. Click **"Redeploy"** button
3. Wait ~1 minute for deployment to complete
4. Check if https://eduhens-api.vercel.app/api/health returns `{"ok":true}`

## If Still Not Working

Tell me:
- What's the Root Directory currently set to?
- Do you see any deployment errors in the logs?
- Screenshot of the settings page would help

---

**Most likely issue**: Root Directory is not set to `backend`

