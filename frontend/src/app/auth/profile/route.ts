// frontend/src/app/auth/profile/route.ts
// Redirect handler for incorrect /auth/profile calls

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to the correct backend API route
  const url = new URL(request.url);
  const redirectUrl = new URL('/api/auth/me', url.origin);
  
  // Preserve all query parameters
  url.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });
  
  console.log('[Auth Profile Redirect]', url.pathname, '→', redirectUrl.pathname);
  
  return NextResponse.redirect(redirectUrl);
}

