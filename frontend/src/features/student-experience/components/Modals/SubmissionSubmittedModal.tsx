'use client';

import { CheckCircle } from 'lucide-react';
import ModalFrame from '../shared/ModalFrame';

interface SubmissionSubmittedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSummary: () => void;
}

export default function SubmissionSubmittedModal({
  isOpen,
  onClose,
  onViewSummary,
}: SubmissionSubmittedModalProps) {
  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[880px] rounded-[36px] border border-[#e6e6e6] bg-white shadow-2xl"
      contentClassName="flex flex-col items-center gap-8 px-16 py-14 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Submission sent!</h2>
        <p className="mt-2 text-sm text-slate-500">
          We’ve shared your work with the educator. You’ll get notified once the task is reviewed.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-[#e6e6e6] px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-[#484de6] hover:text-[#484de6]"
        >
          Back to workspace
        </button>
        <button
          onClick={onViewSummary}
          className="rounded-lg bg-[#484de6] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3A3FE4]"
        >
          View submission summary
        </button>
      </div>
    </ModalFrame>
  );
}
