// src/middleware.ts   
import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0"; 

export async function middleware(request: NextRequest) {
  console.log("Middleware running for:", request.nextUrl.pathname);
  // Enforce Auth0 authentication for protected routes
  const response = await auth0.middleware(request);
  return response;
}


export const config = {
  matcher: [
    '/api/auth/:path*',         // Auth0 SDK routes
    '/dashboard-selection',     // Dashboard selection requires auth
    '/educator-experience',     // Educator dashboard requires auth
    '/student-experience',      // Student dashboard requires auth
    '/t/:path*',                // Deep link enrollment requires auth
    '/admin/:path*',            // Admin tools require auth
  ],
};
