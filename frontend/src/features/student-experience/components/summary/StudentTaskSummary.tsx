'use client';

import { useEffect, useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import TaskHeader from '../shared/TaskHeader';
import TaskSection from '../shared/TaskSection';
import { Layout3 } from '@/shared/components/layout';
import type { StudentTask } from '@/features/student-experience/types/studentTask';
import { parseResourceLink } from '@/shared/utils/resourceLinks';
import SubmissionFeedbackPanel from './SubmissionFeedbackPanel';
import { getLatestSubmission } from '@/features/student-experience/services/studentTaskService';

// TODO(db): Ensure student view reads the same TaskFormData schema as educator.
// - When integrating backend, map StudentTask to TaskFormData fields for consistency

interface StudentTaskSummaryProps {
  task: StudentTask;
  onBackToWorkspace: () => void;
  onBackToEnroll?: () => void;
  onRefreshTask?: () => Promise<void>;
}

export default function StudentTaskSummary({ task, onBackToWorkspace, onBackToEnroll, onRefreshTask }: StudentTaskSummaryProps) {
  const [refreshedTask, setRefreshedTask] = useState<StudentTask>(task);
  
  // Poll for AI assessment if it's not available yet and task is submitted/graded
  useEffect(() => {
    const aiAssessment = refreshedTask.summary?.feedback?.aiAssessment || [];
    const hasAiAssessment = Array.isArray(aiAssessment) && aiAssessment.length > 0;
    const isSubmitted = refreshedTask.status === 'submitted' || refreshedTask.status === 'graded' || refreshedTask.status === 'closed';
    
    if (!hasAiAssessment && isSubmitted) {
      // Poll for AI assessment (up to 30 seconds)
      let attempts = 0;
      const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds
      
      const pollForAssessment = async () => {
        try {
          const latest = await getLatestSubmission(task.id);
          if (latest?.ai_feedback && latest.ai_feedback !== '[no-content]') {
            // AI assessment is now available - refresh task
            if (onRefreshTask) {
              await onRefreshTask();
            }
            return true;
          }
        } catch (e) {
          console.error('[StudentTaskSummary] Error polling for AI assessment:', e);
        }
        return false;
      };
      
      const interval = setInterval(async () => {
        attempts++;
        const found = await pollForAssessment();
        if (found || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 2000); // Check every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [refreshedTask.summary?.feedback?.aiAssessment, refreshedTask.status, task.id, onRefreshTask]);
  
  // Update refreshedTask when task prop changes (e.g., after refresh)
  useEffect(() => {
    setRefreshedTask(task);
  }, [task]);
  
  const summary = refreshedTask.summary;
  const submission = refreshedTask.submission ?? { files: [], links: [], notes: '' };
  const isPassed = summary?.feedback?.status === 'passed';
  const academicIntegrityNote = task.academicIntegrity && task.academicIntegrity.trim().length
    ? task.academicIntegrity
    : undefined;

  return (
    <Layout3
      header={
        <TaskHeader
          educatorName={refreshedTask.educatorName}
          educatorAvatarUrl={refreshedTask.educatorAvatarUrl}
          taskTitle={refreshedTask.title}
          leftContent={
            onBackToEnroll ? (
              <button
                type="button"
                onClick={onBackToEnroll}
                className="bg-white border border-[#cccccc] flex items-center gap-[7px] px-[16px] py-[10px] rounded-[4px] text-[#595959] text-[14px] hover:bg-gray-50 hover:border-[#999999] transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-4 text-[#595959]" />
                Back to enrollment
              </button>
            ) : null
          }
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
              <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">{refreshedTask.objective}</p>
            </div>
          </TaskSection>

          <TaskSection title="Step by step instructions">
            <div className="flex w-full flex-col gap-[8px]">
              {refreshedTask.instructions.map((step, index) => (
                <div key={index} className="flex w-full items-start gap-[4px] pl-[8px] font-normal leading-[1.5]">
                  <p className="shrink-0 whitespace-pre text-[14px] tracking-[0.28px] text-[#999999]">{index + 1}.</p>
                  <p className="grow text-[16px] tracking-[0.32px] text-[#414651]">{step}</p>
                </div>
              ))}
            </div>
          </TaskSection>

          <TaskSection title="What You'll Submit">
            <ul className="flex w-full flex-col gap-[8px] pl-[32px] text-[16px] font-normal tracking-[0.32px] text-[#414651] marker:text-[#414651]">
              {refreshedTask.submissionChecklist.map((item, index) => (
                <li key={index} className="leading-[1.5]">
                  {item}
                </li>
              ))}
            </ul>
          </TaskSection>

          {refreshedTask.duration && (
            <TaskSection title="How Long It'll Take">
              <div className="flex w-full items-center gap-[10px] pl-[8px]">
                <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                  {refreshedTask.duration}
                </p>
              </div>
            </TaskSection>
          )}

          {refreshedTask.resources && refreshedTask.resources.length > 0 && (
            <TaskSection title="Resources to Help You">
              <div className="flex w-full flex-col gap-[16px] pl-[8px]">
                {refreshedTask.resources
                  .map((resource) => parseResourceLink(resource))
                  .filter(Boolean)
                  .map((resource, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <p className="text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#414651]">
                        {resource!.title}
                      </p>
                      {resource!.href ? (
                        <a
                          href={resource!.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#484de6] underline decoration-solid break-all cursor-pointer hover:text-[#2f35c4]"
                        >
                          {resource!.displayUrl ?? resource!.href}
                        </a>
                      ) : (
                        <p className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                          {resource!.title}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </TaskSection>
          )}

          {refreshedTask.reflectionQuestions && refreshedTask.reflectionQuestions.length > 0 && (
            <TaskSection title="Reflect on Your Work">
              <div className="flex w-full flex-col gap-[16px] pl-[8px]">
                <ul className="list-disc space-y-2 pl-[24px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                  {refreshedTask.reflectionQuestions.map((question, index) => (
                    <li key={index} className="leading-[1.5]">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </TaskSection>
          )}

          {refreshedTask.assessmentCriteria && refreshedTask.assessmentCriteria.length > 0 && (
            <TaskSection title="How You'll Be Assessed">
              <div className="flex w-full flex-col gap-[16px] pl-[8px]">
                <p className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                  Your work will be evaluated based on these criteria:
                </p>
                <ul className="list-disc space-y-2 pl-[24px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                  {refreshedTask.assessmentCriteria.map((criterion, index) => (
                    <li key={index} className="leading-[1.5]">
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            </TaskSection>
          )}

          {refreshedTask.level && (
            <TaskSection title="Task Level">
              <div className="flex w-full items-center gap-[10px] pl-[8px]">
                <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                  {refreshedTask.level}
                </p>
              </div>
            </TaskSection>
          )}

          {refreshedTask.hints && refreshedTask.hints.length > 0 && (
            <TaskSection title="Tips and Support">
              <ul className="list-disc space-y-2 pl-[32px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                {refreshedTask.hints.map((hint, index) => (
                  <li key={index} className="leading-[1.5]">
                    {hint}
                  </li>
                ))}
              </ul>
            </TaskSection>
          )}

          <TaskSection title="A Note on Academic Integrity" className="pb-[96px]">
            <div className="flex w-full items-center gap-[10px] pl-[8px]">
              <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                {academicIntegrityNote || 'No academic integrity note has been added for this task.'}
              </p>
            </div>
          </TaskSection>
        </div>
      }
      rightContent={
        <div className="flex h-full min-h-0 flex-col gap-6">
          <SubmissionFeedbackPanel summary={summary} submission={submission} />
          <button
            onClick={onBackToWorkspace}
            className="rounded-2xl border border-[#e9eaeb] bg-white px-6 py-3 text-sm font-medium text-[#484de6] transition-colors hover:bg-[#eef0ff] cursor-pointer"
          >
            Back to workspace
          </button>
        </div>
      }
    />
  );
}
