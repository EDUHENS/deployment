// frontend/src/app/auth/callback/route.ts
// Temporary redirect handler for Auth0 callback
// This handles the case where Auth0 redirects to /auth/callback instead of /api/auth/callback

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the full URL with all query parameters
  const url = new URL(request.url);
  
  // Redirect to the correct Auth0 SDK callback route
  const redirectUrl = new URL('/api/auth/callback', url.origin);
  
  console.log('=== DEBUG ===');
  console.log('Request URL:', request.url);
  console.log('url.origin:', url.origin);
  console.log('url.host:', url.host);
  console.log('redirectUrl.origin:', redirectUrl.origin);
  console.log('redirectUrl.host:', redirectUrl.host);
  console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);

  // Preserve all query parameters (code, state, etc.)
  url.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });
  
  console.log('[Auth Callback Redirect]', url.pathname, '→', redirectUrl.pathname);
  
  // Redirect to the Auth0 SDK handler
  return NextResponse.redirect(redirectUrl);
}

