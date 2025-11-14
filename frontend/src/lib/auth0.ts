// src/lib/auth0.ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

// Customize the Auth0 client to gracefully handle callback errors
// e.g., when the user cancels at the IdP and Auth0 redirects back with error=access_denied
export const auth0 = new Auth0Client({
  // Reason: Request API tokens for the backend by default so /api/auth/access-token
  // returns a token the backend accepts (audience must match backend's expected audience).
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE || "openid profile email offline_access",
  },
  onCallback: async (error, ctx) => {
    const baseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || "http://localhost:3000";
    // Reason: Default post-login destination is Dashboard Selection when no returnTo is provided.
    const safeReturnTo = ctx?.returnTo || "/dashboard-selection";

    if (error) {
      // Reason: When the user cancels at the IdP (e.g., Google), Auth0 redirects back
      // with an error. Redirecting to the SDK route "/api/auth/login" would immediately
      // re-trigger the Hosted Login. We want to show our own app's login UI instead.
      // Therefore, redirect to the app's local login page ("/") and include context.
      const reason = ("cause" in error && (error as any).cause?.code) || error.code || "access_denied";
      const url = new URL("/", baseUrl); // Redirect to local login UI, not Hosted Login
      url.searchParams.set("returnTo", safeReturnTo);
      url.searchParams.set("authError", String(reason));
      return NextResponse.redirect(url);
    }

    // Successful authentication: send the user to original destination (or dashboard selection by default)
    return NextResponse.redirect(new URL(safeReturnTo, baseUrl));
  },
});
