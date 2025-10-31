'use client';

//import { UserProvider } from '@auth0/nextjs-auth0/'; 
// //import has typescript error
const auth0Client = require('@auth0/nextjs-auth0/client');

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const UserProvider = auth0Client.UserProvider;
    return <UserProvider>{children}</UserProvider>;
}