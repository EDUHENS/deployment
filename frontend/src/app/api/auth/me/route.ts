//src/app/api/auth/me/route.ts
//old code
/*
import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  return (auth0 as any).authClient.handleProfile(req);
}
  */
 // 🔁 src/app/api/auth/me/route.ts  或  src/app/auth/profile/route.ts
import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // 🔴 新增：把 request 的重要資訊打到 Render logs
  const authHeader = req.headers.get('authorization');
  const cookies = req.cookies.getAll();
  console.log('============================');
  console.log('[api/auth/me] Incoming request');

  // 請求來源網址（重要：可以看是哪個頁面觸發）
  console.log('[api/auth/me] Referer:', req.headers.get('referer'));

  // 實際 server 看到的 URL
  console.log('[api/auth/me] Request URL:', url.toString());
  console.log('[api/auth/me] Host:', url.host);
  console.log('[api/auth/me] Origin:', url.origin);
  console.log('[api/auth/me] Origin:', );
  
  console.log('[api/auth/me] Incoming request', {
    url: url.toString(),
    pathname: url.pathname,
    method: req.method,
    hasAuthHeader: !!authHeader,
    // make sure get Bearer
    authHeaderPreview: authHeader
      ? `${authHeader.slice(0, 25)}... (len=${authHeader.length})`
      : null,
    cookieNames: cookies.map((c) => c.name),
  });

  try {
    //  Auth0 profile 
    const res = await (auth0 as any).authClient.handleProfile(req);

    // print response status
    console.log('[api/auth/me] Response status:', (res as any).status);

    return res;
  } catch (error: any) {
    // print error details
    console.error('[api/auth/me] Error in handleProfile:', {
      name: error?.name,
      message: error?.message,
      code: (error as any)?.code,
    });
    throw error;
  }
}

