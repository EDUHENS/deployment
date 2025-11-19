// This catch-all route handles all Auth0 authentication routes:
// - /api/auth/login
// - /api/auth/callback
// - /api/auth/logout
// - /api/auth/me
// - /api/auth/access-token
import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
    },
    returnTo: '/dashboard-selection',
  }),
  callback: handleCallback({
    afterCallback: async (req, res, session) => {
      // Custom callback handling if needed
      return session;
    },
  }),
  logout: handleLogout({
    returnTo: '/',
  }),
});

