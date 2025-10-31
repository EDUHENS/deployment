'use client';

import { Sparkles } from 'lucide-react';
import ModalFrame from '../shared/ModalFrame';

interface SubmissionSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmissionSavedModal({ isOpen, onClose }: SubmissionSavedModalProps) {
  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[880px] rounded-[36px] border border-[#e6e6e6] bg-white shadow-xl"
      contentClassName="flex flex-col items-center gap-8 px-16 py-14 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef0ff] text-[#484de6]">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">Submission Saved</h2>
      <p className="text-sm text-slate-500">
        Your draft is safe. You can return anytime to make changes or upload additional work.
      </p>
      <button
        onClick={onClose}
        className="rounded-lg bg-[#484de6] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3A3FE4]"
      >
        Back to editing
      </button>
    </ModalFrame>
  );
}
