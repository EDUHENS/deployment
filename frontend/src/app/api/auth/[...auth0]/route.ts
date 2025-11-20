// This catch-all route handles all Auth0 authentication routes:
// - /api/auth/login
// - /api/auth/callback
// - /api/auth/logout
// - /api/auth/me
// - /api/auth/access-token
import { auth0 } from '@/lib/auth0';

export const GET = auth0.handleAuth({
  login: auth0.handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
    },
    returnTo: '/dashboard-selection',
  }),
  callback: auth0.handleCallback({
    afterCallback: async (_req, session) => {
      // Custom callback handling if needed
      return session;
    },
  }),
  logout: auth0.handleLogout({
    returnTo: '/',
  }),
});

