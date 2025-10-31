'use client';

import { ReactNode } from 'react';

interface Layout3Props {
  header: ReactNode;
  leftContent: ReactNode;
  rightContent: ReactNode;
}

export default function Layout3({ header, leftContent, rightContent }: Layout3Props) {
  return (
    <div className="size-full grid grid-rows-[110px_1fr] gap-px bg-[#E6E6E6] relative min-h-0">
      {/* Header */}
      <div className="bg-[#F8F8F8] overflow-hidden">
        {header}
      </div>

      {/* Content Split */}
      <div className="grid grid-cols-2 gap-px bg-[#E6E6E6] min-h-0">
        {/* Left Content */}
        <div className="bg-[#F8F8F8] overflow-hidden min-h-0">
          {leftContent}
        </div>

        {/* Right Content */}
        <div className="bg-[#F8F8F8] overflow-hidden min-h-0">
          {rightContent}
        </div>
      </div>
    </div>
  );
}
