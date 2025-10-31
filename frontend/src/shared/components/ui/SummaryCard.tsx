'use client';

import { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value?: string | number;
  children?: ReactNode;
  className?: string;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}

export default function SummaryCard({
  title,
  value,
  children,
  className = '',
  bgColor = 'bg-[#f6f6fe]',
  borderColor = 'border-[#d2d3f9]',
  textColor = 'text-[#484de6]'
}: SummaryCardProps) {
  return (
    <div className={`basis-0 ${bgColor} border-2 ${borderColor} border-solid grow min-h-px min-w-px relative rounded-[4px] self-stretch shrink-0 ${className}`}>
      <div className="box-border content-stretch flex flex-col font-['Helvetica_Neue:Bold',sans-serif] gap-[8px] items-center justify-center not-italic overflow-clip px-[8px] py-[16px] relative rounded-[inherit] size-full text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
        <p className={`leading-[1.5] relative shrink-0 ${textColor}`}>
          {title}
        </p>
        {value && (
          <p className={`leading-[normal] relative shrink-0 ${textColor}`}>
            {value}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}