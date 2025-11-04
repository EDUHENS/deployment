// src/app/dashboard-selection/page.tsx
'use client';

import DashboardSelection from '@/features/dashboard-selection/components/DashboardSelection';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function DashboardSelectionPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  //back to login if not log in
   if (isLoading) return null;
  // Reason: Avoid hitting SDK route "/auth/login" which triggers Auth0 Hosted Login directly.
  // Redirect to our app's local login page instead, preserving intended destination.
  if (!user) { router.push('/?returnTo=/dashboard-selection'); return null; }

  const handleSelect = (type: 'educator' | 'student') => {
    console.log('Selected dashboard type:', type);
    if (type === 'educator') {
      router.push('/educator-experience');
    } else {
      router.push('/student-experience');
    }
  };

  return <DashboardSelection onSelect={handleSelect} />;
}
