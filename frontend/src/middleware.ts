// src/middleware.ts   
import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0"; 

export async function middleware(request: NextRequest) {

  return auth0.middleware(request);
}


export const config = {
  matcher: [
    '/auth/:path*',           //login, logout callback / profile
    '/dashboard-selection',   
    '/educator-experience',     // set up first
    '/student-experience',      // set up for student   
  ],
};
