'use client';

import clsx from 'clsx';
import Image from 'next/image';
import type { ReactNode } from 'react';

interface TaskHeaderProps {
  educatorName: string;
  educatorAvatarUrl?: string;
  taskTitle: string;
  rightContent?: ReactNode;
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
  className,
}: TaskHeaderProps) {
  return (
    <div
      className={clsx(
        'box-border flex w-full items-start justify-between bg-[#f8f8f8] px-[16px] pb-[16px] pt-[32px]',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-[8px] overflow-clip">
        <div className="flex w-full flex-col gap-[4px]">
          <div className="flex items-center gap-[8px]">
            <div className="size-[24px] shrink-0 overflow-hidden rounded-full border border-[#484de6]">
              <Image
                src={educatorAvatarUrl}
                alt={educatorName}
                width={24}
                height={24}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[20px] font-medium leading-[1.5] tracking-[0.4px] text-[#222222]">{educatorName}</p>
          </div>
        </div>

        <div className="flex w-full items-start justify-between gap-[16px]">
          <p className="flex-1 text-[16px] font-medium leading-[1.5] tracking-[0.32px] text-[#222222]">
            {taskTitle}
          </p>
          {rightContent && <div className="flex shrink-0 items-center gap-[16px]">{rightContent}</div>}
        </div>
      </div>
    </div>
  );
}
