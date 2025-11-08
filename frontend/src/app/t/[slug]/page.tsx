'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';

async function getToken(): Promise<string> {
  const r = await fetch('/auth/access-token', { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to obtain access token');
  const j: any = await r.json();
  return j.accessToken || j.token;
}

export default function EnrollPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [state, setState] = React.useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    const run = async () => {
      try {
        if (!params?.slug) return;
        setState('loading');
        const token = await getToken();
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${BACKEND_URL}/api/enroll/${params.slug}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text();
          setState('error');
          setMessage(text || 'Enrollment failed');
          return;
        }
        const j = await res.json();
        setState('success');
        setMessage(`Enrolled to task: ${j?.task?.title || ''}`);
        // Navigate student to dashboard after short delay
        setTimeout(() => router.push('/student-experience'), 1200);
      } catch (e: any) {
        setState('error');
        setMessage(e?.message || 'Unexpected error');
      }
    };
    run();
  }, [params?.slug, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
        <h1 className="text-lg font-semibold mb-2">Join Task</h1>
        {state === 'loading' && <p className="text-gray-600">Processing enrollment…</p>}
        {state === 'success' && <p className="text-green-700">{message || 'Enrolled successfully.'}</p>}
        {state === 'error' && (
          <div>
            <p className="text-red-700">{message || 'Failed to enroll.'}</p>
            <p className="text-xs text-gray-500 mt-2">Make sure you are logged in.</p>
          </div>
        )}
      </div>
    </div>
  );
}
