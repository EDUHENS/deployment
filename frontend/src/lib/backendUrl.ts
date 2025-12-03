export function getBackendUrl() {
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- typeof window:', typeof window);
  console.log('- NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
  console.log('- INTERNAL_BACKEND_URL:', process.env.INTERNAL_BACKEND_URL);
  console.log('- VERCEL_URL:', process.env.VERCEL_URL);

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
