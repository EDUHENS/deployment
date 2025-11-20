// This catch-all route handles all Auth0 authentication routes:
// - /api/auth/login
// - /api/auth/callback
// - /api/auth/logout
// - /api/auth/me
// - /api/auth/access-token
import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0/server';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE || "openid profile email offline_access",
    },
  }),
  logout: handleLogout(),
  callback: handleCallback(),
});

