// src/app/api/auth/[auth0]/auth0Route.ts
//import { handleAuth } from '@auth0/nextjs-auth0'; //import has error
const auth0Module = require('@auth0/nextjs-auth0');
export const GET = auth0Module.handleAuth();
export const POST = auth0Module.handleAuth();