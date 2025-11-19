'use client';

import Image from 'next/image';

export default function TaskCreationSlogan() {
  return (
    <div className="flex flex-col items-center gap-4 text-center" data-name="task-creation-slogan">
      <div className="flex items-end justify-center gap-4">
        <div className="h-[72px] w-[64px] relative shrink-0">
          <Image
            src="/hens-main.svg"
            alt="Hens assistant icon"
            fill
            className="object-contain"
            loading="lazy"
          />
        </div>
        <p
          className="font-nunito text-[#484de6] text-center text-[24px] italic font-bold leading-[normal] tracking-[0.48px] whitespace-nowrap"
        >
          Hens can turn words into comprehensive tasks
        </p>
      </div>
    </div>
  );
}

