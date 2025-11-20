# Vercel Project Settings - CRITICAL CONFIGURATION

## ⚠️ IMPORTANT: Root Directory Setting

**The Root Directory MUST be set to `.` (dot) or left empty, NOT `frontend`!**

### How to Fix:

1. Go to: https://vercel.com/eduhens/deployment/settings
2. Scroll to "Root Directory"
3. Change from `frontend` to `.` (just a dot)
4. Click "Save"

## Build & Development Settings

Go to: https://vercel.com/eduhens/deployment/settings

### Framework Preset
- Set to: **Other** (or leave as-is if Next.js is detected)

### Root Directory
- **CRITICAL**: Set to `.` (the project root)
- **NOT** `frontend` - this causes the "Module not found" errors!

### Build Command
```bash
npm run build
```

### Output Directory
```bash
frontend/.next
```

### Install Command
```bash
npm install
```

### Node.js Version
- Set to: **20.x** (latest LTS)

## Why This Configuration?

Our project is a monorepo with this structure:
```
deployment/
├── package.json          <- Root build orchestration
├── vercel.json           <- Vercel configuration
├── frontend/
│   ├── package.json      <- Frontend dependencies
│   ├── next.config.js    <- Next.js config (with outputFileTracingRoot)
│   └── src/              <- Frontend source
├── backend/
│   ├── package.json      <- Backend dependencies
│   └── src/              <- Backend source
└── api/
    └── index.js          <- Vercel serverless function wrapper
```

**The root `package.json` contains the build scripts that:**
1. Install backend dependencies (`postinstall` script)
2. Build the frontend (`build` script)
3. Copy backend files to `.backend` for Vercel functions

**Setting Root Directory to `frontend` breaks this because:**
- Vercel can't find the root `package.json` build scripts
- The monorepo structure is not respected
- Module resolution fails

## After Changing Settings

1. Change Root Directory to `.`
2. Save the settings
3. Go to the latest failed deployment
4. Click "Redeploy"
5. The build should now succeed!

