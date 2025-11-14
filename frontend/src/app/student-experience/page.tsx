// src/app/student-experience/page.tsx
// Reason: Provide a protected Student dashboard route using mock data.
// - Redirect unauthenticated users to the local login UI ("/") with returnTo
// - Render StudentDashboard which already reads mock data via useStudentTasks

'use client';

import StudentDashboard from '@/features/student-experience/components/StudentDashboard';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function StudentExperiencePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  if (isLoading) return null;

  // Reason: Always route post-login to Dashboard Selection (role choice UI).
  // Avoid "/api/auth/login" and preserve the intention via `returnTo=/dashboard-selection`.
  if (!user) { router.push('/?returnTo=/dashboard-selection'); return null; }

  // Optional logout handler, mirroring educator page behavior
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const returnTo = encodeURIComponent(`${origin}/`);
      window.location.href = `/api/auth/logout?returnTo=${returnTo}`;
    }
  };

  return <StudentDashboard onLogout={handleLogout} />;
}
