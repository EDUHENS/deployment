// src/lib/auth0.ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

// Debug log to check env vars
console.log("AUTH0 Config Debug:", {
  audience: process.env.AUTH0_AUDIENCE,
  clientIdLength: process.env.AUTH0_CLIENT_ID?.length,
  scope: process.env.AUTH0_SCOPE,
});

// Configuration object - handle missing env vars gracefully during build
const auth0Config: any = {};

// Ensure Auth0 always receives a valid secret for HKDF encryption/decryption
const sessionSecret =
  process.env.AUTH0_SECRET ||
  process.env.AUTH0_CLIENT_SECRET ||
  process.env.AUTH0_SESSION_SECRET;

if (sessionSecret) {
  auth0Config.secret = sessionSecret;
} else if (process.env.NODE_ENV === "development") {
  auth0Config.secret = "local-development-session-secret-123456789012345678901234567890";
  console.warn(
    "AUTH0_SECRET is missing. Using a fallback secret for local development. Set AUTH0_SECRET to a secure value."
  );
} else {
  throw new Error("AUTH0_SECRET is required in production to decrypt sessions.");
}

// Only add authorizationParameters if audience is defined
if (process.env.AUTH0_AUDIENCE) {
  auth0Config.authorizationParameters = {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE || "openid profile email offline_access",
  };
}

// Add callback handler
auth0Config.onCallback = async (error: any, ctx: any) => {
  const baseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || "http://localhost:3000";
  console.log('[lib/auth0] onCallback:', baseUrl);
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
};

// Customize the Auth0 client to gracefully handle callback errors
// e.g., when the user cancels at the IdP and Auth0 redirects back with error=access_denied
export const auth0 = new Auth0Client(auth0Config);
