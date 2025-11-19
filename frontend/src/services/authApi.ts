// src/services/authApi.ts
// Reason: Fetch Auth0 access token from Next SDK route and call backend with Authorization.

import { getBackendUrl } from '@/lib/backendUrl';

// Accept both our custom route shape and the SDK's default shape
export type AccessTokenResponse =
  | {
      accessToken: string;
      scope?: string;
      expiresAt?: number;
      token_type?: string;
      audience?: string;
    }
  | {
      token: string;
      scope?: string;
      expires_at?: number;
      token_type?: string;
      audience?: string;
    };

const BACKEND_URL = getBackendUrl();

async function getAccessToken(): Promise<string> {
  console.log('[authApi] Requesting /api/auth/access-token');
  const res = await fetch('/api/auth/access-token', { credentials: 'include' });
  console.log('[authApi] /api/auth/access-token status:', res.status);
  if (!res.ok) throw new Error('Failed to obtain access token');
  const data = (await res.json()) as AccessTokenResponse;
  const token = (data as any).accessToken || (data as any).token;
  console.log('[authApi] token key present:', Object.keys(data || {}));
  if (!token) throw new Error('No access token in response');
  return token as string;
}

async function authFetch(input: string, init?: RequestInit) {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  console.log('[authApi] Fetching backend:', input);
  const res = await fetch(input, { ...init, headers });
  console.log('[authApi] Backend response:', res.status, res.statusText);
  return res;
}

export async function getMe() {
  console.log('[authApi] getMe ->', `${BACKEND_URL}/api/auth/me`);
  const res = await authFetch(`${BACKEND_URL}/api/auth/me`);
  return res.json();
}

export async function listUsers() {
  console.log('[authApi] listUsers');
  const res = await authFetch(`${BACKEND_URL}/api/auth/users`);
  return res.json();
}

export async function assignUserRole(userId: string, role: string) {
  console.log('[authApi] assignUserRole', userId, role);
  const res = await authFetch(`${BACKEND_URL}/api/auth/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
  return res.json();
}

export async function removeUserRole(userId: string, role: string) {
  console.log('[authApi] removeUserRole', userId, role);
  const res = await authFetch(`${BACKEND_URL}/api/auth/users/${userId}/roles/${role}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function updateMe(profile: { name?: string; picture?: string; fullName?: string }) {
  const body: any = {};
  if (profile.name !== undefined) body.name = profile.name;
  if (profile.fullName !== undefined) body.full_name = profile.fullName;
  if (profile.picture !== undefined) body.picture = profile.picture;
  const res = await authFetch(`${BACKEND_URL}/api/auth/me`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (res.status === 204) {
    return { ok: res.ok };
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  return { ok: res.ok, raw: text };
}

export async function ensureRole(role: 'student' | 'teacher') {
  console.log('[authApi] ensureRole called with role:', role);
  try {
    const res = await authFetch(`${BACKEND_URL}/api/auth/me/roles`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    console.log('[authApi] ensureRole response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[authApi] ensureRole error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return errorJson;
      } catch {
        return { ok: false, error: errorText || 'Failed to assign role' };
      }
    }
    
    const result = await res.json();
    console.log('[authApi] ensureRole result:', result);
    return result;
  } catch (error) {
    console.error('[authApi] ensureRole exception:', error);
    return { ok: false, error: String(error) };
  }
}
