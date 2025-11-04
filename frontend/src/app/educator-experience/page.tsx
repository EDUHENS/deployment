// src/app/dashboard-selection/page.tsx
'use client';

import EducatorDashboard  from  '@/features/educator-experience/EducatorDashboardPage'
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function DashboardSelectionPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  //back to login if not log in
   if (isLoading) return null;
  if (!user) {router.push('/auth/login?returnTo=/educator-experience'); return null; }

/*  const handleSelect = (type: 'educator' | 'student') => {
    console.log('Selected dashboard type:', type);

  };*/

  return <EducatorDashboard />;
}