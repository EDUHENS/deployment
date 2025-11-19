// src/middleware.ts   
import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0"; 

export async function middleware(request: NextRequest) {
  console.log("Middleware: AUTH0_CLIENT_ID from env:", JSON.stringify(process.env.AUTH0_CLIENT_ID));
  return auth0.middleware(request);
}


export const config = {
  matcher: [
    '/api/auth/:path*',         // Auth0 SDK routes
    '/dashboard-selection',   
    '/educator-experience',     // set up first
    '/student-experience',      // set up for student  
    '/t/:path*',                // deep link enrollment requires auth
    '/admin/:path*',            // admin tools
  ],
};
