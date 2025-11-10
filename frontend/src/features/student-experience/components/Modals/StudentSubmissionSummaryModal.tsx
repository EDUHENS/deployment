'use client';

import ModalFrame from '../shared/ModalFrame';

interface StudentSubmissionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'pending' | 'pass' | 'fail' | null;
  feedback?: string | null;
}

export default function StudentSubmissionSummaryModal({
  isOpen,
  onClose,
  status,
  feedback,
}: StudentSubmissionSummaryModalProps) {
  let parsed: any = null;
  try {
    if (feedback) {
      let cleaned = feedback.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
      parsed = JSON.parse(cleaned);
    }
  } catch {}
  const overall = (parsed?.overall || status || 'pending') as 'pass' | 'fail' | 'pending';
  const headline = overall === 'pending' ? 'Grading in progress' : overall === 'pass' ? 'Passed' : 'Failed';
  const tone = overall === 'pass' ? 'text-emerald-600' : overall === 'fail' ? 'text-red-600' : 'text-slate-600';

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[880px] rounded-[36px] border border-[#e6e6e6] bg-white shadow-2xl"
      contentClassName="flex flex-col gap-6 px-10 py-8"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Submission Summary</h2>
        <p className={`mt-2 text-sm ${tone}`}>{headline}</p>
      </div>

      {parsed ? (
        <div className="space-y-4">
          {typeof parsed.summary === 'string' && (
            <div>
              <p className="text-sm font-semibold text-slate-800">Summary</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{parsed.summary}</p>
            </div>
          )}
          {Array.isArray(parsed.criteria) && parsed.criteria.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-800">Criteria</p>
              <ul className="mt-1 space-y-2">
                {parsed.criteria.map((c: any, i: number) => (
                  <li key={i} className="text-sm text-slate-700">
                    <span className="font-medium">{c?.name || `Criterion ${i + 1}`}</span>
                    {c?.level && <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c.level}</span>}
                    {c?.comment && <p className="mt-1 whitespace-pre-wrap">{c.comment}</p>}
                    {c?.improvement && <p className="mt-1 text-slate-600 whitespace-pre-wrap">Improvement: {c.improvement}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback ? console.debug('[AI] Raw feedback (hidden in UI):', feedback) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">We are preparing your AI feedback. This may take a few moments.</p>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-[#e6e6e6] px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#484de6] hover:text-[#484de6]">
          Close
        </button>
      </div>
    </ModalFrame>
  );
}
