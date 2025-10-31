'use client';

import { ReactNode } from 'react';

export interface Layout1Props {
  children: ReactNode;
}

export default function Layout1({ children }: Layout1Props) {
  return (
    <div className="bg-[#F8F8F8] w-full h-full relative flex items-center justify-center">
      {children}
    </div>
  );
}
