'use client';

import { ReactNode } from 'react';

interface SplashLayoutProps {
  children: ReactNode;
}

export default function SplashLayout({ children }: SplashLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      {children}
    </div>
  );
}
