// src/app/educator-experience/page.tsx
'use client';

import { useEffect } from 'react';
import EducatorDashboard from '@/features/educator-experience/EducatorDashboardPage';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function EducatorExperiencePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  // Redirect unauthenticated users after first render (avoid router mutations during render)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/?returnTo=/dashboard-selection');
    }
  }, [isLoading, user, router]);

  if (isLoading) return null;
  if (!user) return null; // waiting for redirect

  return <EducatorDashboard />;
}
