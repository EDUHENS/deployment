'use client';

import { useState } from 'react';
import AIInputBox from '@/shared/components/forms/AInputBox';
import { Layout3 } from '@/shared/components/layout';
import TaskHeader from '../shared/TaskHeader';
import TaskSection from '../shared/TaskSection';
import DueStatusIndicator from '../shared/DueStatusIndicator';
import SubmissionForm from './SubmissionForm';
import type { StudentTask } from '@/features/student-experience/types/studentTask';
import { getDueStatus } from '@/features/student-experience/utils/dates';
import {
  RESOURCE_LINKS,
  REFLECTION_PROMPTS,
  ASSESSMENT_CRITERIA,
  SUPPORT_EXAMPLES,
} from '@/features/student-experience/constants/taskContent';

interface SubmissionPayload {
  files: Array<{ id: string; name: string }>;
  links: Array<{ id: string; url: string }>;
  notes: string;
}

interface StudentTaskWorkspaceProps {
  task: StudentTask;
  onSaveSubmission: (taskId: string, payload: SubmissionPayload) => void;
  onSubmitSubmission: (taskId: string, payload: SubmissionPayload) => void;
}

export default function StudentTaskWorkspace({ task, onSaveSubmission, onSubmitSubmission }: StudentTaskWorkspaceProps) {
  const [hintPrompt, setHintPrompt] = useState('');
  const submission = task.submission ?? {
    files: [],
    links: [],
    notes: '',
    updatedAt: new Date().toISOString(),
  };
  const dueStatus = getDueStatus(task.dueDate);

  const handleSave = (payload: { files: typeof submission.files; links: typeof submission.links; notes: string }) => {
    onSaveSubmission(task.id, payload);
  };

  const handleSubmit = (payload: { files: typeof submission.files; links: typeof submission.links; notes: string }) => {
    onSubmitSubmission(task.id, payload);
  };

  return (
    <Layout3
      header={
        <TaskHeader
          educatorName={task.educatorName}
          taskTitle={task.title}
          rightContent={<DueStatusIndicator label={dueStatus.label} tone={dueStatus.tone} />}
        />
      }
      leftContent={
        <div className="relative flex h-full min-h-0 flex-col items-start gap-[48px] overflow-y-auto pl-[24px] pr-[16px] py-[24px]">
          <TaskSection title="Objective">
            <div className="flex w-full items-center gap-[10px] pl-[8px]">
              <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">{task.objective}</p>
            </div>
          </TaskSection>

          <TaskSection title="Step by step instructions">
            <div className="flex w-full flex-col gap-[8px]">
              {task.instructions.map((step, index) => (
                <div
                  key={index}
                  className="flex w-full items-start gap-[4px] pl-[8px] font-normal leading-[1.5]"
                >
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

          <div className="sticky bottom-0 left-0 z-10 flex w-full items-center justify-center pb-[16px] pt-[8px]">
            <AIInputBox
              value={hintPrompt}
              onChange={setHintPrompt}
              onSubmit={() => {
                if (!hintPrompt.trim()) return;
                setHintPrompt('');
              }}
              placeholder="Hens can give you hints"
              maxWidth="530px"
            />
          </div>
        </div>
      }
      rightContent={
        <SubmissionForm
          initialFiles={submission.files}
          initialLinks={submission.links}
          initialNotes={submission.notes}
          onSaveDraft={handleSave}
          onSubmitFinal={handleSubmit}
        />
      }
    />
  );
}
