'use client';

import { useState } from 'react';
import { Link as LinkIcon, Lock } from 'lucide-react';
import type { EnrollPayload } from '@/features/student-experience/types/studentTask';

interface EnrollTaskViewProps {
  onEnroll: (payload: EnrollPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export default function EnrollTaskView({ onEnroll, isSubmitting = false }: EnrollTaskViewProps) {
  const [link, setLink] = useState('www.tasktitle-eduhens.com');
  const [passcode, setPasscode] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Allow enrollment even without filling required fields for mock purposes
    await onEnroll({ link: link.trim() || 'mock-task-link', passcode: passcode.trim() || 'mock-passcode' });
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
            <div className="relative w-full rounded-[4px] border border-[#e9eaeb] bg-white transition-all focus-within:border-[#484de6] focus-within:ring-4 focus-within:ring-[#c7d7fe] hover:border-[#cfd1d4]">
              <div className="flex items-center justify-between overflow-clip rounded-[inherit] px-4 py-6">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="h-[24px] flex-1 leading-[1.5] text-[#717680] outline-none placeholder:text-[#717680]"
                  placeholder="www.tasktitle-eduhens.com"
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
            <div className="relative w-full rounded-[4px] border border-[#e9eaeb] bg-white transition-all focus-within:border-[#484de6] focus-within:ring-4 focus-within:ring-[#c7d7fe] hover:border-[#cfd1d4]">
              <div className="flex items-center justify-between overflow-clip rounded-[inherit] px-4 py-6">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="h-[24px] flex-1 leading-[1.5] text-[#717680] outline-none placeholder:text-[#717680]"
                  placeholder="**********"
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
            disabled={isSubmitting}
            className="w-full rounded-[4px] bg-[#484de6] px-8 py-5 text-center text-[16px] font-normal leading-[normal] text-[#f8f8f8] transition-colors hover:bg-[#3A3FE4] disabled:cursor-not-allowed disabled:bg-[#8487f7]"
          >
            {isSubmitting ? 'Enrolling…' : 'Enroll'}
          </button>
        </form>
      </div>
    </div>
  );
}
