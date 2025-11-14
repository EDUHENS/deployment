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
  useEffect(() => {
    if (isLoading || !user) return;
    try {
      const payload = {
        sub: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
      };
      sessionStorage.setItem('eduhens.user', JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
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
