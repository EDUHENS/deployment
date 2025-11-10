'use client';

import { CheckCircle } from 'lucide-react';
import ModalFrame from '../shared/ModalFrame';

interface SubmissionSubmittedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSummary: () => void;
  aiStatus?: 'pending' | 'pass' | 'fail' | null;
  aiFeedback?: string | null;
}

export default function SubmissionSubmittedModal({
  isOpen,
  onClose,
  onViewSummary,
  aiStatus = null,
  aiFeedback = null,
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
        {aiStatus == null || aiStatus === 'pending' ? (
          <p className="mt-2 text-sm text-slate-500">
            We’ve shared your work with the educator. Hens is grading your work now — this may take a moment.
          </p>
        ) : (
          <div className="mt-2 text-left max-w-[680px]">
            <p className="text-sm text-slate-700">
              Hens AI assessment: <span className={aiStatus === 'pass' ? 'text-emerald-600' : 'text-red-600'}>{aiStatus.toUpperCase()}</span>
            </p>
            {aiFeedback && (
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-[12px] text-slate-700 border border-slate-200">
                {aiFeedback}
              </pre>
            )}
          </div>
        )}
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
