# 🚀 Quick Start: Deploy Backend in 5 Minutes

## Step 1: Create Vercel Project (2 minutes)

1. Go to: **https://vercel.com/new**
2. Click **"Import Project"**
3. Select repository: **EDUHENS/deployment**
4. **IMPORTANT**: Set these settings:
   ```
   Project Name: eduhens-api
   Root Directory: backend
   Framework: Other
   ```
5. Click **"Deploy"** (it will deploy, but won't work yet - that's okay!)

## Step 2: Add Environment Variables (2 minutes)

1. After project is created, go to: **Settings → Environment Variables**
2. Open the file `BACKEND_ENV_VARIABLES.txt` I just created
3. For each variable:
   - Click **"Add New"**
   - Copy name and value from the file
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click **"Save"**

**Note**: For `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY`:
   - Check your local `backend/.env` file
   - Copy the values from there

## Step 3: Redeploy Backend (1 minute)

1. Go to: **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. This time it will work because environment variables are set!

## Step 4: Tell Me the URL

Once deployed, tell me:
```
"Backend is deployed at: https://eduhens-api.vercel.app"
```

## ✅ What I'll Do Next (Automatic)

Once you give me the backend URL, I'll:

1. ✅ Update frontend environment variable (`NEXT_PUBLIC_BACKEND_URL`)
2. ✅ Update Auth0 allowed origins
3. ✅ Test all backend endpoints
4. ✅ Verify end-to-end flow
5. ✅ Confirm everything works

## 🎯 Expected Result

After this:
- ✅ Auth0 login works
- ✅ Backend API works (tasks, submissions, etc.)
- ✅ Database queries work
- ✅ AI features work
- ✅ Full app is production-ready!

---

**Current Status**: Frontend is deployed at https://eduhens.vercel.app
**Next**: Deploy backend following steps above 👆

