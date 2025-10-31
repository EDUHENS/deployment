'use client';

import Image from 'next/image';

export default function HensLoader() {
  return (
    <div className="hens-loader-wrapper flex min-h-screen w-full flex-col items-center justify-center bg-[#f8f8f8]" role="status">
      <div className="hens-loader-stack relative flex flex-col items-center gap-16">
        <div className="hens-loader-floating relative flex flex-col items-center gap-12">
          <Image
            src="/hens-main.svg"
            alt="EduHens mascot"
            width={400}
            height={400}
            className="hens-loader-float drop-shadow-lg"
          />
          <Image
            src="/type-only-logo.svg"
            alt="EduHens wordmark"
            width={600}
            height={140}
            className="hens-loader-float drop-shadow-sm"
          />
        </div>

        <div className="hens-spinner mt-24" />
      </div>
    </div>
  );
}
