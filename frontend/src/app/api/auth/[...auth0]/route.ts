// This catch-all route handles all Auth0 authentication routes:
// - /api/auth/login
// - /api/auth/callback
// - /api/auth/logout
// - /api/auth/me
// - /api/auth/access-token
import { auth0 } from '@/lib/auth0';

export const GET = auth0.handleAuth;

