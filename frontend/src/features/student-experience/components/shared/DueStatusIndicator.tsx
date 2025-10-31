'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

interface DueStatusIndicatorProps {
  label: string;
  tone?: 'success' | 'warning' | 'muted';
  className?: string;
  indicatorClassName?: string;
  icon?: ReactNode;
}

const toneIndicator: Record<NonNullable<DueStatusIndicatorProps['tone']>, string> = {
  success: 'bg-[#12B76A]',
  warning: 'bg-[#F79009]',
  muted: 'bg-gray-400',
};

export default function DueStatusIndicator({
  label,
  tone = 'muted',
  className,
  indicatorClassName,
  icon,
}: DueStatusIndicatorProps) {
  return (
    <div className={clsx('flex items-center gap-[8px] whitespace-nowrap', className)}>
      {icon ?? <span className={clsx('size-[10px] rounded-full', indicatorClassName ?? toneIndicator[tone])} />}
      <p className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#222222]">{label}</p>
    </div>
  );
}
