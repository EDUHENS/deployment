import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  // 新增
  const url = new URL(req.url);
  const returnTo = url.searchParams.get('returnTo') || 'N/A';
  console.log('[Auth Logout] User initiated logout', {
    path: url.pathname,
    returnTo,
    time: new Date().toISOString(),
  });
  return (auth0 as any).authClient.handleLogout(req);
}
