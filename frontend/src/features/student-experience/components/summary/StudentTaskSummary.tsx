'use client';

import { Lock } from 'lucide-react';
import TaskHeader from '../shared/TaskHeader';
import TaskSection from '../shared/TaskSection';
import { Layout3 } from '@/shared/components/layout';
import type { StudentTask } from '@/features/student-experience/types/studentTask';
import {
  RESOURCE_LINKS,
  REFLECTION_PROMPTS,
  ASSESSMENT_CRITERIA,
  SUPPORT_EXAMPLES,
} from '@/features/student-experience/constants/taskContent';
import SubmissionFeedbackPanel from './SubmissionFeedbackPanel';

interface StudentTaskSummaryProps {
  task: StudentTask;
  onBackToWorkspace: () => void;
}

export default function StudentTaskSummary({ task, onBackToWorkspace }: StudentTaskSummaryProps) {
  const summary = task.summary;
  const submission = task.submission ?? { files: [], links: [], notes: '' };
  const isPassed = summary?.feedback?.status === 'passed';
  const fallbackEducatorFeedback = `Overall, the submission demonstrates strong understanding and technical execution on “${task.title}”, with minor areas for improvement in validation and documentation depth.`;
  const fallbackAIAssessment = [
    `Component Design & Props: “${task.title}” keeps components modular and prop-driven, resulting in a clear, reusable structure across the workspace.`,
    'Code Quality & Validation: Good (85%) — clean and mostly well-documented code with minor inconsistencies in runtime validation. Consider tightening nested prop checks.',
    'Report & Reflection: Satisfactory — the retrospective is structured and thoughtful, though deeper storytelling around design choices would strengthen the takeaway.',
    'Creativity & Originality: Excellent — the experience highlights cohesive visuals and distinctive layout choices that elevate the project.',
  ];
  const fallbackAISummary =
    'Overall, the submission demonstrates strong understanding and technical execution with minor areas for improvement in validation and documentation depth.';
  const fallbackAttachments = [
    { id: 'fallback-file', label: `${task.title} brief.pdf`, type: 'file' as const },
    { id: 'fallback-link', label: `${task.title} repo`, type: 'link' as const },
  ];

  return (
    <Layout3
      header={
        <TaskHeader
          educatorName={task.educatorName}
          taskTitle={task.title}
          rightContent={
            <div className="flex items-center gap-[24px]">
              {isPassed && (
                <div className="flex items-center gap-[8px]">
                  <span className="flex h-[20px] w-[20px] items-center justify-center">
                    <span className="inline-block h-[12px] w-[12px] rounded-full bg-[#12B76A]" aria-hidden />
                  </span>
                  <p className="whitespace-nowrap text-[16px] font-bold tracking-[0.32px] text-[#039855]">Passed</p>
                </div>
              )}
              <div className="flex items-center gap-[4px] whitespace-nowrap">
                <Lock className="size-5 text-[#222222]" aria-hidden />
                <p className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#222222]">Closed</p>
              </div>
            </div>
          }
        />
      }
      leftContent={
        <div className="flex h-full min-h-0 flex-col items-start gap-[48px] overflow-y-auto pl-[24px] pr-[16px] py-[24px]">
          <TaskSection title="Objective">
            <div className="flex w-full items-center gap-[10px] pl-[8px]">
              <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">{task.objective}</p>
            </div>
          </TaskSection>

          <TaskSection title="Step by step instructions">
            <div className="flex w-full flex-col gap-[8px]">
              {task.instructions.map((step, index) => (
                <div key={index} className="flex w-full items-start gap-[4px] pl-[8px] font-normal leading-[1.5]">
                  <p className="shrink-0 whitespace-pre text-[14px] tracking-[0.28px] text-[#999999]">{index + 1}.</p>
                  <p className="grow text-[16px] tracking-[0.32px] text-[#414651]">{step}</p>
                </div>
              ))}
            </div>
          </TaskSection>

          <TaskSection title="What You'll Submit">
            <ul className="flex w-full flex-col gap-[8px] pl-[32px] text-[16px] font-normal tracking-[0.32px] text-[#414651] marker:text-[#414651]">
              {task.submissionChecklist.map((item, index) => (
                <li key={index} className="leading-[1.5]">
                  {item}
                </li>
              ))}
            </ul>
          </TaskSection>

          <TaskSection title="How Long It'll Take">
            <div className="flex w-full items-center gap-[10px] pl-[8px]">
              <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                You&apos;ll need approximately 6–8 hours to complete this task over the course of 1 week.
              </p>
            </div>
          </TaskSection>

          <TaskSection title="Resources to Help You">
            <div className="flex w-full flex-col gap-[12px] pl-[8px]">
              {RESOURCE_LINKS.map((resource) => (
                <p
                  key={resource}
                  className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#484de6] underline decoration-solid"
                >
                  {resource}
                </p>
              ))}
            </div>
          </TaskSection>

          <TaskSection title="Reflect on Your Work">
            <div className="flex w-full flex-col gap-[16px] pl-[8px]">
              <p className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                After completing the task, take a moment to think about the following:
              </p>
              <ul className="list-disc space-y-2 pl-[24px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                {REFLECTION_PROMPTS.map((question) => (
                  <li key={question} className="leading-[1.5]">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </TaskSection>

          <TaskSection title="How You'll Be Assessed">
            <div className="flex w-full flex-col gap-[16px] pl-[8px]">
              <p className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                Your work will be evaluated based on these criteria:
              </p>
              <ul className="list-disc space-y-2 pl-[24px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                {ASSESSMENT_CRITERIA.map((criterion) => (
                  <li key={criterion} className="leading-[1.5]">
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          </TaskSection>

          <TaskSection title="Task Level">
            <div className="flex w-full items-center gap-[10px] pl-[8px]">
              <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                This is an Introductory to Intermediate level task — ideal if you&apos;ve started learning React and want to
                deepen your understanding of component-based development.
              </p>
            </div>
          </TaskSection>

          <TaskSection title="Tips and Support">
            <ul className="list-disc space-y-2 pl-[32px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
              {SUPPORT_EXAMPLES.map((example) => (
                <li key={example} className="leading-[1.5]">
                  {example}
                </li>
              ))}
            </ul>
          </TaskSection>

          <TaskSection title="A Note on Academic Integrity" className="pb-[96px]">
            <div className="flex w-full items-center gap-[10px] pl-[8px]">
              <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                Make sure your work is your own. If you use external sources or code snippets, cite them properly. Learning
                happens best when you build and reflect on your own solutions.
              </p>
            </div>
          </TaskSection>
        </div>
      }
      rightContent={
        <div className="flex h-full min-h-0 flex-col gap-6">
          <SubmissionFeedbackPanel
            summary={summary}
            submission={submission}
            fallbackEducatorFeedback={fallbackEducatorFeedback}
            fallbackAIAssessment={fallbackAIAssessment}
            fallbackAISummary={fallbackAISummary}
            fallbackAttachments={fallbackAttachments}
          />
          <button
            onClick={onBackToWorkspace}
            className="rounded-2xl border border-[#e9eaeb] bg-white px-6 py-3 text-sm font-medium text-[#484de6] transition-colors hover:bg-[#eef0ff]"
          >
            Back to workspace
          </button>
        </div>
      }
    />
  );
}
