'use client';

import { ReactNode } from 'react';

export interface StudentMainLayoutProps {
  sidebar: ReactNode;
  mainContent: ReactNode;
}

export default function StudentMainLayout({ sidebar, mainContent }: StudentMainLayoutProps) {
  return (
    <div className="bg-[#e6e6e6] flex h-screen overflow-hidden">
      {/* Sidebar */}
      {sidebar}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {mainContent}
      </div>
    </div>
  );
}

