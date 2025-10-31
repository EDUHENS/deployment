'use client';

import clsx from 'clsx';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

type HappyHensMascotProps = HTMLAttributes<HTMLDivElement>;

/**
 * Centralized renderer for the happy hens SVG mascot so every surface uses the same asset.
 */
export default function HappyHensMascot({ className, ...rest }: HappyHensMascotProps) {
  return (
    <div className={clsx('relative h-[91px] w-[80px]', className)} {...rest}>
      <Image src="/hens-happy.svg" alt="Happy Hens mascot" fill className="object-contain" />
    </div>
  );
}
