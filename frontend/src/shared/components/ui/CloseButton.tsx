'use client';

import { X } from 'lucide-react';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CloseButton({ onClick, className = '', size = 'md' }: CloseButtonProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-[#d9d9d9] text-white hover:bg-[#c5c5c5] transition-all duration-200 cursor-pointer hover:rotate-90 ${className}`}
      aria-label="Close"
    >
      <X className={`${iconSizes[size]} text-[#4a4a4a]`} strokeWidth={3} />
    </button>
  );
}

