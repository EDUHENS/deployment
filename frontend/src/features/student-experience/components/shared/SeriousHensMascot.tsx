'use client';

import clsx from 'clsx';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

type SeriousHensMascotProps = HTMLAttributes<HTMLDivElement>;

/**
 * Renderer for the serious hens SVG mascot (used when task fails).
 */
export default function SeriousHensMascot({ className, ...rest }: SeriousHensMascotProps) {
  return (
    <div className={clsx('relative h-[91px] w-[80px]', className)} {...rest}>
      <Image src="/hens-serious.svg" alt="Serious Hens mascot" fill className="object-contain" />
    </div>
  );
}

