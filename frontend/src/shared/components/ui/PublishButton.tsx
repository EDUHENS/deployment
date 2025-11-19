'use client';

import { useState } from 'react';
import RocketIcon from './RocketIcon';

interface PublishButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function PublishButton({ 
  onClick, 
  disabled = false, 
  label = 'Publish Task',
  className = '',
  style = {}
}: PublishButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`disabled:opacity-50 disabled:cursor-not-allowed box-border cursor-pointer flex gap-[7px] items-center justify-center overflow-visible relative rounded-[4px] transition-all duration-300 ${className}`}
      style={{ 
        borderRadius: '4px',
        border: isHovered ? '3px solid #FA906A' : '3px solid #6976EB',
        background: '#484DE6',
        ...style
      }}
    >
      <div className="relative shrink-0 size-[16px]">
        <RocketIcon isHovered={isHovered} />
      </div>
      <span className="font-['Helvetica_Neue:Regular',sans-serif] leading-normal not-italic relative shrink-0 text-[#f8f8f8] text-[16px] text-nowrap whitespace-pre">
        {label}
      </span>
    </button>
  );
}

