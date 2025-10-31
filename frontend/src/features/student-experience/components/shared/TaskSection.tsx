'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

interface TaskSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}

/**
 * Consistent wrapper for student task sections on the left rail.
 */
export default function TaskSection({ title, children, className, titleClassName }: TaskSectionProps) {
  return (
    <section className={clsx('flex w-full flex-col gap-[16px] items-start', className)}>
      <div className="flex w-full items-center justify-center gap-[8px] pl-[8px]">
        <p
          className={clsx(
            'grow text-[20px] font-medium leading-[1.5] tracking-[0.4px] text-[#414651]',
            titleClassName,
          )}
        >
          {title}
        </p>
      </div>
      {children}
    </section>
  );
}
