'use client';

import { ReactNode } from 'react';

export interface ContentContainerProps {
  children: ReactNode;
  className?: string;
  padding?: 'default' | 'none' | 'large';
}

export default function ContentContainer({ 
  children, 
  className = '', 
  padding = 'default' 
}: ContentContainerProps) {
  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'large':
        return 'p-8';
      case 'default':
      default:
        return 'p-6';
    }
  };

  return (
    <div className={`bg-[#f8f8f8] w-full h-full ${getPaddingClass()} ${className}`}>
      {children}
    </div>
  );
}
