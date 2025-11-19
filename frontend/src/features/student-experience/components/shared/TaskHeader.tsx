'use client';

import clsx from 'clsx';
import Image from 'next/image';
import type { ReactNode } from 'react';

interface TaskHeaderProps {
  educatorName: string;
  educatorAvatarUrl?: string;
  taskTitle: string;
  rightContent?: ReactNode;
  leftContent?: ReactNode;
  className?: string;
}

/**
 * Shared header for student task surfaces (workspace & summary). Keeps educator identity,
 * task title and allows consumers to inject context-specific meta on the right side.
 */
export default function TaskHeader({
  educatorName,
  educatorAvatarUrl = 'https://i.pravatar.cc/64?img=8',
  taskTitle,
  rightContent,
  leftContent,
  className,
}: TaskHeaderProps) {
  return (
    <div
      className={clsx(
        'box-border flex h-full w-full items-center justify-between bg-[#f8f8f8] px-[48px] py-[16px]',
        className,
      )}
    >
      <div className="flex items-center gap-[24px] overflow-hidden">
        {leftContent && <div className="flex shrink-0 items-center">{leftContent}</div>}
        <div className="flex flex-col gap-[6px]">
          <p className="text-[18px] font-semibold leading-[1.4] tracking-[0.36px] text-[#222222] whitespace-nowrap">
            {taskTitle}
          </p>
          <div className="flex items-center gap-[12px]">
            <div className="size-[24px] shrink-0 overflow-hidden rounded-full border border-[#484de6]">
              <Image
                src={educatorAvatarUrl}
                alt={educatorName}
                width={24}
                height={24}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[16px] font-medium leading-[1.5] tracking-[0.32px] text-[#555555]">{educatorName}</p>
          </div>
        </div>
      </div>
      {rightContent && <div className="flex shrink-0 items-center gap-[16px]">{rightContent}</div>}
    </div>
  );
}
