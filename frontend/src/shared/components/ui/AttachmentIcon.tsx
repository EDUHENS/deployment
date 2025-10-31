'use client';

import { FileText, Github } from 'lucide-react';

interface AttachmentIconProps {
  type: 'pdf' | 'github';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AttachmentIcon({ type, size = 'sm', className = '' }: AttachmentIconProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const colorClasses = type === 'pdf' 
    ? 'text-red-500' 
    : 'text-gray-600';

  return (
    <>
      {type === 'pdf' ? (
        <FileText className={`${sizeClasses[size]} ${colorClasses} ${className}`} />
      ) : (
        <Github className={`${sizeClasses[size]} ${colorClasses} ${className}`} />
      )}
    </>
  );
}
