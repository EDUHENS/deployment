// This catch-all route handles all Auth0 authentication routes:
// - /api/auth/login
// - /api/auth/callback
// - /api/auth/logout
// - /api/auth/me
// - /api/auth/access-token
//old code, fix problem
import { auth0 } from '@/lib/auth0';
//import { handleAuth } from "@auth0/nextjs-auth0";


export const GET = auth0.handleAuth;
//export default handleAuth();

