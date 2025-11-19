// frontend/src/app/page.tsx
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SplashLayout } from '@/shared/components/layout';
import { HensLoader } from '@/shared/components/ui';

const SPLASH_DURATION_MS = 3000; // Show loader for 3 seconds before redirecting to Auth0

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  const normalizedReturnTo = useMemo(() => {
    const raw = searchParams?.get('returnTo') || '/dashboard-selection';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }, [searchParams]);

  // Show splash screen for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // If user is authenticated, redirect to dashboard
  // User data comes from Auth0/backend, no need to store in sessionStorage
  useEffect(() => {
    if (isLoading || !user) return;
    // User data is available from Auth0 hook and backend API
    router.replace(normalizedReturnTo);
  }, [isLoading, user, normalizedReturnTo, router]);

  // If not authenticated and splash is done, redirect to Auth0
  useEffect(() => {
    if (!isLoading && !user && !showSplash) {
      // Redirect directly to Auth0 login
      const returnTo = encodeURIComponent(normalizedReturnTo);
      window.location.href = `/api/auth/login?returnTo=${returnTo}`;
    }
  }, [isLoading, user, showSplash, normalizedReturnTo]);

  // Always show loader (either waiting for auth state or about to redirect)
  return (
    <SplashLayout>
      <HensLoader />
    </SplashLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<SplashLayout><HensLoader /></SplashLayout>}>
      <HomeContent />
    </Suspense>
  );
}
