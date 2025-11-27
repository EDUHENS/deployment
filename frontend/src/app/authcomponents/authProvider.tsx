'use client';

//import { UserProvider } from '@auth0/nextjs-auth0/'; 
// //import has typescript error
// Temporary fix: using require() to bypass TypeScript type check issue with @auth0/nextjs-auth0 import
//const auth0Client = require('@auth0/nextjs-auth0/client');

import {  Auth0Provider } from '@auth0/nextjs-auth0/client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    //const UserProvider = auth0Client.UserProvider;
    return <Auth0Provider>{children}</Auth0Provider>;
}