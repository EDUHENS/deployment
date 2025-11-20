export function getBackendUrl() {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  if (typeof window === 'undefined') {
    if (process.env.INTERNAL_BACKEND_URL) {
      return process.env.INTERNAL_BACKEND_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/api/backend`;
    }
    return 'http://localhost:5001';
  }

  return '/api/backend';
}
