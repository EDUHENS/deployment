// frontend/src/app/page.tsx
'use client';

import App from "../App";
import { auth0 } from '@/lib/auth0';
import Auth0Mock from '@/features/auth/components/Auth0Mock';
import { redirect } from 'next/navigation';

export default function Home() {
  
  return <App />;
}
