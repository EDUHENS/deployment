// src/services/authApi.ts
// Reason: Fetch Auth0 access token from Next SDK route and call backend with Authorization.

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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

async function getAccessToken(): Promise<string> {
  console.log('[authApi] Requesting /auth/access-token');
  const res = await fetch('/auth/access-token', { credentials: 'include' });
  console.log('[authApi] /auth/access-token status:', res.status);
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

export async function updateMe(profile: { firstName?: string; lastName?: string; picture?: string; fullName?: string }) {
  const body: any = {};
  if (profile.firstName !== undefined) body.first_name = profile.firstName;
  if (profile.lastName !== undefined) body.last_name = profile.lastName;
  if (profile.picture !== undefined) body.picture = profile.picture;
  if (profile.fullName !== undefined) body.full_name = profile.fullName;
  const res = await authFetch(`${BACKEND_URL}/api/auth/me`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return res.json();
}
