'use client';

import { useState } from 'react';
import AIInputBox from '@/shared/components/forms/AInputBox';
import { Layout3 } from '@/shared/components/layout';
import TaskHeader from '../shared/TaskHeader';
import TaskSection from '../shared/TaskSection';
import DueStatusIndicator from '../shared/DueStatusIndicator';
import SubmissionForm from './SubmissionForm';
import { uploadSubmissionFile, deleteSubmissionAsset, askForHints } from '@/features/student-experience/services/studentTaskService';
import HintsModal from '../Modals/HintsModal';
import type { StudentTask } from '@/features/student-experience/types/studentTask';
import { getDueStatus } from '@/features/student-experience/utils/dates';
// Removed hardcoded constants - using task data from database instead
import { parseResourceLink } from '@/shared/utils/resourceLinks';
import { ArrowLeft } from 'lucide-react';

interface SubmissionPayload {
  files: Array<{ id: string; name: string }>;
  links: Array<{ id: string; url: string }>;
  notes: string;
}

interface StudentTaskWorkspaceProps {
  task: StudentTask;
  onSaveSubmission: (taskId: string, payload: SubmissionPayload) => void;
  onSubmitSubmission: (taskId: string, payload: SubmissionPayload) => void;
  onShowSummary?: () => void;
  onBackToEnroll?: () => void;
  onNavigateToEnrollment?: () => void;
}

export default function StudentTaskWorkspace({
  task,
  onSaveSubmission,
  onSubmitSubmission,
  onShowSummary,
  onBackToEnroll,
  onNavigateToEnrollment,
}: StudentTaskWorkspaceProps) {
  const [hintPrompt, setHintPrompt] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [hintsData, setHintsData] = useState<{ hints: string[]; next_steps?: string[]; pinpointed_issues?: string[] }>({ hints: [] });
  const submission = task.submission ?? {
    files: [],
    links: [],
    notes: '',
    updatedAt: new Date().toISOString(),
  };
  const dueStatus = getDueStatus(task.dueDate);
  const academicIntegrityNote = task.academicIntegrity && task.academicIntegrity.trim().length
    ? task.academicIntegrity
    : null;

  const handleSave = (payload: { files: typeof submission.files; links: typeof submission.links; notes: string }) => {
    try {
      // eslint-disable-next-line no-console
      console.log('[StudentTaskWorkspace] save', { taskId: task.id, files: payload.files.length, links: payload.links.length });
    } catch {}
    onSaveSubmission(task.id, payload);
  };

  const handleSubmit = (payload: { files: typeof submission.files; links: typeof submission.links; notes: string }) => {
    try {
      // eslint-disable-next-line no-console
      console.log('[StudentTaskWorkspace] submit', { taskId: task.id, files: payload.files.length, links: payload.links.length });
    } catch {}
    onSubmitSubmission(task.id, payload);
  };

  const handleUpload = async (file: File): Promise<{ assetId: string; file_name: string; submissionId?: string }> => {
    try {
      console.log('[StudentTaskWorkspace] Uploading file to Supabase:', file.name, file.size);
      const result = await uploadSubmissionFile(task.id, file);
      console.log('[StudentTaskWorkspace] File uploaded successfully:', result);
      // Return the first asset (should be the uploaded file)
      if (Array.isArray(result) && result.length > 0) {
        return { 
          assetId: result[0].id, 
          file_name: result[0].file_name || file.name,
          submissionId: result[0].submissionId
        };
      }
      throw new Error('No asset returned from upload');
    } catch (e) {
      const errorMsg = (e as any)?.message || 'Unknown error';
      console.error('[StudentTaskWorkspace] Upload failed:', errorMsg);
      throw e; // Re-throw so SubmissionForm can show error
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteSubmissionAsset(task.id, assetId);
    } catch (e) {
      console.warn('Delete asset failed', (e as any)?.message || e);
    }
  };

  return (
    <>
    <Layout3
      header={
        <TaskHeader
          educatorName={task.educatorName}
          educatorAvatarUrl={task.educatorAvatarUrl}
          taskTitle={task.title}
          leftContent={
            onBackToEnroll ? (
              <button
                type="button"
                onClick={onBackToEnroll}
                className="bg-white border border-[#cccccc] flex items-center gap-[7px] px-[16px] py-[10px] rounded-[4px] text-[#595959] text-[14px] hover:bg-gray-50 hover:border-[#999999] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#595959]" />
                Back to enrollment
              </button>
            ) : null
          }
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

          {task.duration && (
            <TaskSection title="How Long It'll Take">
              <div className="flex w-full items-center gap-[10px] pl-[8px]">
                <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                  {task.duration}
                </p>
              </div>
            </TaskSection>
          )}

          {task.resources && task.resources.length > 0 && (
            <TaskSection title="Resources to Help You">
              <div className="flex w-full flex-col gap-[16px] pl-[8px]">
                {task.resources
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

          {task.reflectionQuestions && task.reflectionQuestions.length > 0 && (
            <TaskSection title="Reflect on Your Work">
              <div className="flex w-full flex-col gap-[16px] pl-[8px]">
                <ul className="list-disc space-y-2 pl-[24px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                  {task.reflectionQuestions.map((question, index) => (
                    <li key={index} className="leading-[1.5]">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </TaskSection>
          )}

          {task.assessmentCriteria && task.assessmentCriteria.length > 0 && (
            <TaskSection title="How You'll Be Assessed">
              <div className="flex w-full flex-col gap-[16px] pl-[8px]">
                <p className="text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                  Your work will be evaluated based on these criteria:
                </p>
                <ul className="list-disc space-y-2 pl-[24px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                  {task.assessmentCriteria.map((criterion, index) => (
                    <li key={index} className="leading-[1.5]">
                      {criterion}
                    </li>
                  ))}
                </ul>

                {Array.isArray(task.rubric) && task.rubric.length > 0 && (
                  <div className="mt-4 bg-[#e6e6e6] border border-[#e6e6e6] rounded-[4px] p-2">
                    <div className="grid grid-cols-[repeat(5,_minmax(0,_1fr))] auto-rows-fr gap-[2px] max-h-[575px]">
                      {task.rubric[0]?.map((header, colIndex) => (
                        <div key={colIndex} className="bg-[#2d2e34] flex items-center p-4 rounded-[2px]">
                          <p className="text-[#f8f8f8] text-[12px] tracking-[0.24px] leading-[1.5] break-words whitespace-pre-wrap">
                            {header || `Column ${colIndex + 1}`}
                          </p>
                        </div>
                      ))}
                      {task.rubric.slice(1).map((row, rowIndex) => (
                        row.map((cell, colIndex) => (
                          <div key={`${rowIndex}-${colIndex}`} className="bg-white flex items-start p-2 rounded-[2px]">
                            <p className="text-black text-[12px] tracking-[0.24px] leading-[1.5] break-words whitespace-pre-wrap">
                              {cell || '-'}
                            </p>
                          </div>
                        ))
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TaskSection>
          )}

          {task.level && (
            <TaskSection title="Task Level">
              <div className="flex w-full items-center gap-[10px] pl-[8px]">
                <p className="grow text-[16px] font-normal leading-[1.5] tracking-[0.32px] text-[#414651]">
                  {task.level}
                </p>
              </div>
            </TaskSection>
          )}

          {task.hints && task.hints.length > 0 && (
            <TaskSection title="Tips and Support">
              <ul className="list-disc space-y-2 pl-[32px] text-[16px] font-normal tracking-[0.32px] text-[#414651]">
                {task.hints.map((hint, index) => (
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

          <div className="sticky bottom-0 left-0 z-10 flex w-full items-center justify-center pb-[16px] pt-[8px]">
            <AIInputBox
              value={hintPrompt}
              onChange={setHintPrompt}
              onSubmit={async () => {
                const q = hintPrompt.trim();
                if (!q) return;
                try {
                  const res = await askForHints(task.id, q);
                  setHintsData(res);
                  setShowHints(true);
                } catch (e) {
                  console.warn('Hints failed', (e as any)?.message || e);
                } finally {
                  setHintPrompt('');
                }
              }}
              placeholder="Hens can give you hints"
              maxWidth="530px"
            />
          </div>
        </div>
      }
      rightContent={
        <SubmissionForm
          taskId={task.id}
          initialFiles={submission.files}
          initialLinks={submission.links}
          initialNotes={submission.notes}
          onSaveDraft={handleSave}
          onSubmitFinal={handleSubmit}
          onUploadFile={handleUpload}
          onDeleteAsset={handleDeleteAsset}
          onNavigateToEnrollment={onNavigateToEnrollment}
        />
      }
    />
    {showHints && (
      <HintsModal
        isOpen={showHints}
        onClose={() => setShowHints(false)}
        hints={hintsData.hints}
        nextSteps={hintsData.next_steps}
        issues={hintsData.pinpointed_issues}
      />
    )}
    </>
  );
}
