// src/middleware.ts   
import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0"; 

export async function middleware(request: NextRequest) {
  console.log("Middleware running for:", request.nextUrl.pathname);
  // return auth0.middleware(request);
  const response = await auth0.middleware(request);
  return response;
}


export const config = {
  matcher: [
    '/api/auth/:path*',         // Auth0 SDK routes
    // '/dashboard-selection',   // Temporarily disabled for debugging 404
    '/educator-experience',     // set up first
    '/student-experience',      // set up for student  
    '/t/:path*',                // deep link enrollment requires auth
    '/admin/:path*',            // admin tools
  ],
};
