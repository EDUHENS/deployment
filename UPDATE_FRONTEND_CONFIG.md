# Frontend Configuration Update

## What Needs to Change

The frontend currently calls `/api/backend/*` for backend routes, but we need it to call the separate backend deployment at `https://eduhens-api.vercel.app`.

## Environment Variable to Add

Go to: **https://vercel.com/eduhens/eduhens/settings/environment-variables**

Add this variable:

```
Name: NEXT_PUBLIC_BACKEND_URL
Value: https://eduhens-api.vercel.app
Environments: ✅ Production ✅ Preview ✅ Development
```

## What This Does

- Frontend will call `https://eduhens-api.vercel.app/api/*` for all backend requests
- No more proxy needed
- Clean separation of concerns

---

**I'll do this for you once the backend is fully deployed!**

