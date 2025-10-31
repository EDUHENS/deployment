'use client';

import { Github, FileText } from 'lucide-react';
import type { StudentSubmissionDraft, StudentTaskSummary } from '@/features/student-experience/types/studentTask';

interface SubmissionFeedbackPanelProps {
  summary?: StudentTaskSummary | null;
  submission: StudentSubmissionDraft;
  fallbackEducatorFeedback: string;
  fallbackAIAssessment: string[];
  fallbackAISummary: string;
  fallbackAttachments?: AttachmentMeta[];
}

/**
 * Right-rail block for closed tasks: educator feedback, student notes, attachments, and AI assessment.
 */
export default function SubmissionFeedbackPanel({
  summary,
  submission,
  fallbackEducatorFeedback,
  fallbackAIAssessment,
  fallbackAISummary,
  fallbackAttachments = [],
}: SubmissionFeedbackPanelProps) {
  const educatorFeedback = summary?.feedback?.educatorFeedback ?? fallbackEducatorFeedback;
  const aiAssessment = summary?.feedback?.aiAssessment ?? fallbackAIAssessment;
  const attachments = buildAttachments(submission, fallbackAttachments);

  return (
    <aside className="flex h-full min-h-0 flex-col gap-8 overflow-y-auto rounded-3xl bg-[#f8f8f8] px-10 py-8">
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-[#444ce7]">Educator Feedback</h3>
        <div className="rounded-2xl border border-[#c9d4ff] bg-white px-6 py-5">
          <p className="text-base leading-[1.6] text-[#414651]">{educatorFeedback}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-base font-medium text-[#717680]">Your Submission</h3>
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-[#e9eaeb] bg-white px-6 py-5">
            <p className="text-base leading-[1.6] text-[#717680]">
              {submission.notes ||
                "I've completed everything yet wanted to submit early so I can have time to modify."}
            </p>
          </div>
          {attachments.length > 0 && (
            <div className="flex gap-3">
              {attachments.map((attachment) => (
                <AttachmentBadge key={attachment.id} type={attachment.type} label={attachment.label} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-base font-medium text-[#717680]">
          <span>Hens(AI) </span>Assessment
        </h3>
        <div className="rounded-2xl border border-[#e9eaeb] bg-white px-6 py-6">
          <ul className="flex flex-col gap-3 text-base leading-[1.6] text-[#414651]">
            {aiAssessment.map((item, index) => (
              <li key={`${item}-${index}`} className="ml-6 list-disc">
                {item}
              </li>
            ))}
          </ul>
          {summary?.feedback?.aiAssessment == null && (
            <p className="mt-4 text-base leading-[1.6] text-[#414651]">{fallbackAISummary}</p>
          )}
        </div>
      </section>
    </aside>
  );
}

type AttachmentType = 'file' | 'link';

interface AttachmentMeta {
  id: string;
  label: string;
  type: AttachmentType;
}

function buildAttachments(
  submission: StudentSubmissionDraft,
  fallbackAttachments: AttachmentMeta[],
): AttachmentMeta[] {
  if (submission.files.length === 0 && submission.links.length === 0) {
    return fallbackAttachments.slice(0, 2);
  }

  const fileBadges = submission.files.map((file) => ({
    id: file.id,
    label: file.name || 'Submission file',
    type: 'file' as AttachmentType,
  }));

  const linkBadges = submission.links.map((link) => ({
    id: link.id,
    label: link.url || 'Submission link',
    type: 'link' as AttachmentType,
  }));

  return [...fileBadges, ...linkBadges].slice(0, 2);
}

interface AttachmentBadgeProps {
  type: AttachmentType;
  label: string;
}

function AttachmentBadge({ type, label }: AttachmentBadgeProps) {
  const icon =
    type === 'file' ? <FileText className="h-6 w-6 text-[#f15a24]" /> : <Github className="h-6 w-6 text-black" />;

  return (
    <div className="flex h-14 w-20 flex-col items-center justify-center gap-1 rounded-2xl border border-[#e9eaeb] bg-white shadow-sm">
      <span className="sr-only">{label}</span>
      {icon}
      <span className="text-xs font-medium text-[#717680]">{label}</span>
    </div>
  );
}
