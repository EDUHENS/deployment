'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export const useAuth = () => {
  const { user, error, isLoading } = useUser();

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
};