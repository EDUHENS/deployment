// This catch-all route handles all Auth0 authentication routes:
// - /api/auth/login
// - /api/auth/callback
// - /api/auth/logout
// - /api/auth/me
// - /api/auth/access-token
import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin,
  logout: handleLogout,
  callback: handleCallback,
});

