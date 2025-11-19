// src/app/dashboard-selection/page.tsx
'use client';

import DashboardSelection from '@/features/dashboard-selection/components/DashboardSelection';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { getMe, ensureRole } from '@/services/authApi';

export default function DashboardSelectionPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  // Reason: Ensure hooks are called unconditionally across renders.
  // We still mount the effect every render, but gate its body by `isLoading`/`user`.
  useEffect(() => {
    if (isLoading || !user) return;
    (async () => {
      try {
        console.log('[DashboardSelection] calling getMe() to sync user');
        await getMe();
        console.log('[DashboardSelection] getMe() finished');
      } catch {
        console.error('[DashboardSelection] getMe() failed');
      }
    })();
  }, [isLoading, user]);

  //back to login if not log in
  if (isLoading) return null;
  // Reason: Avoid hitting SDK route "/api/auth/login" which triggers Auth0 Hosted Login directly.
  // Redirect to our app's local login page instead, preserving intended destination.
  if (!user) { router.push('/?returnTo=/dashboard-selection'); return null; }

  const handleSelect = async (type: 'educator' | 'student') => {
    if (isAssigningRole) return; // prevent double-clicks
    
    try {
      setIsAssigningRole(true);
      // Dashboard selection is handled via role assignment, no need for sessionStorage
      console.log('[DashboardSelection] Selected dashboard type:', type);
      
      // Assign the appropriate role to the user
      const role = type === 'educator' ? 'teacher' : 'student';
      console.log('[DashboardSelection] Assigning role:', role);
      const result = await ensureRole(role);
      
      if (!result?.ok) {
        console.error('[DashboardSelection] Failed to assign role:', result);
        throw new Error(result?.error || 'Failed to assign role');
      }
      
      console.log('[DashboardSelection] Role assigned successfully');
      
      // Navigate to the appropriate dashboard
      if (type === 'educator') {
        router.push('/educator-experience');
      } else {
        router.push('/student-experience');
      }
    } catch (error) {
      console.error('[DashboardSelection] Error selecting dashboard:', error);
      setIsAssigningRole(false);
      // Still navigate even if role assignment fails (user might already have the role)
      if (type === 'educator') {
        router.push('/educator-experience');
      } else {
        router.push('/student-experience');
      }
    }
  };

  return <DashboardSelection onSelect={handleSelect} />;
}
