// This catch-all route handles Auth0 SDK endpoints (login/callback/logout/me/access-token).
import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  return auth0.middleware(req);
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
//export default handleAuth();
