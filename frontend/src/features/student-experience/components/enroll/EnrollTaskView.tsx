'use client';

import { useState } from 'react';
import { Link as LinkIcon, Lock, Loader2 } from 'lucide-react';
import type { EnrollPayload } from '@/features/student-experience/types/studentTask';

interface EnrollTaskViewProps {
  onEnroll: (payload: EnrollPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export default function EnrollTaskView({ onEnroll, isSubmitting = false }: EnrollTaskViewProps) {
  const [link, setLink] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isLinkFocused, setIsLinkFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isEnrollHovered, setIsEnrollHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoading = isSubmitting || isProcessing;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    try {
      const trimmedLink = link.trim();
      const trimmedPasscode = passcode.trim();
      if (!trimmedLink) {
        setError('Please enter the task link.');
        return;
      }

      setError(null);
      setIsProcessing(true);
      await onEnroll({ link: trimmedLink, passcode: trimmedPasscode });
    } finally {
      setIsProcessing(false);
    }
  };

  // Icons are decorative; no copy interaction in student view per spec

  return (
    <div className="flex h-full min-h-[600px] items-center justify-center bg-[rgba(248,248,248,0.97)]">
      <div className="flex w-[677px] flex-col items-center gap-[72px]">
        <h1 className="text-center text-[24px] font-normal text-[#222222] tracking-[0.48px]">
          Enroll to new task
        </h1>

        <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-[40px]">
          {/* Task Link Input */}
          <div className="flex w-full flex-col gap-[4px]">
            <label className="h-[24px] text-[16px] leading-[1.5] tracking-[0.32px] text-[#717680]">
              Task Link
            </label>
            <div className="group relative w-full rounded-[4px] border border-[#e6e6e6] bg-white transition-colors hover:border-[#484de6] focus-within:border-[#484de6]">
              <div className="flex items-center justify-between overflow-clip rounded-[inherit] px-4 py-6">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onFocus={() => setIsLinkFocused(true)}
                  onBlur={() => setIsLinkFocused(false)}
                  className="h-[24px] flex-1 leading-[1.5] text-[#717680] outline-none placeholder:text-gray-300 group-hover:placeholder:text-gray-600 transition-colors"
                  placeholder={isLinkFocused ? '' : 'www.tasktitle-eduhens.com'}
                />
                <span className="shrink-0" aria-hidden>
                  <LinkIcon className="size-5 text-[#717680]" />
                </span>
              </div>
            </div>
            <p className="h-[24px] text-[14px] leading-[21px] text-[#717680]">
              This should be provided by educator
            </p>
          </div>

          {/* Passcode Input */}
          <div className="flex w-full flex-col gap-[4px]">
            <label className="h-[24px] text-[16px] leading-[1.5] tracking-[0.32px] text-[#717680]">
              Passcode
            </label>
            <div className="group relative w-full rounded-[4px] border border-[#e6e6e6] bg-white transition-colors hover:border-[#484de6] focus-within:border-[#484de6]">
              <div className="flex items-center justify-between overflow-clip rounded-[inherit] px-4 py-6">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                  className="h-[24px] flex-1 leading-[1.5] text-[#717680] outline-none placeholder:text-gray-300 group-hover:placeholder:text-gray-600 transition-colors"
                  placeholder={isPassFocused ? '' : '**********'}
                />
                <span className="shrink-0" aria-hidden>
                  <Lock className="size-5 text-[#717680]" />
                </span>
              </div>
            </div>
            <p className="h-[24px] text-[14px] leading-[21px] text-[#717680]">
              This should be provided by educator
            </p>
          </div>

          {/* Enroll Button */}
          <button
            type="submit"
            disabled={isLoading}
            onMouseEnter={() => setIsEnrollHovered(true)}
            onMouseLeave={() => setIsEnrollHovered(false)}
            className="group/enroll w-full rounded-[4px] bg-[#484de6] px-8 py-5 text-center text-[16px] font-normal leading-[normal] text-[#f8f8f8] transition-all cursor-pointer disabled:cursor-not-allowed disabled:bg-[#8487f7]"
            style={{
              border: isEnrollHovered ? '3px solid #FA906A' : '3px solid #6976EB',
            }}
          >
            <span className="flex items-center justify-center gap-3">
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-white" />}
              {isLoading ? 'Enrolling…' : 'Enroll'}
            </span>
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
