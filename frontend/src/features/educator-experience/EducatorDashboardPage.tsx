'use client';
/**
 * TODO LIST:
 * After db implemenate 
 * TODO(db): handleTaskClick load asign taskId 的 TaskFormData and setTaskFormData(...)
   TODO(db): design draft and publish process to backedn onTaskFormChange、onSaveDraft、onPublishTask
 */
// CHANGED: Render the educator landing view on entry
// Aligns with src/App.tsx (Sidebar tasks + centered input)
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBackendUrl } from '@/lib/backendUrl';
import { MainLayout, Layout1 } from '@/shared/components/layout'; // CHANGED
import { AInputBox } from '@/shared/components/forms'; // CHANGED
import ModifyPreviewModal from '@/features/educator-experience/components/TaskCreation/ModifyPreviewModal';
import type { Task, TaskFormData, StudentSubmission, EducatorSubmissionsMap, ApprovedGradesMap } from './types'; // CHANGED
import { defaultTaskFormData } from '@/features/educator-experience/constants/defaultTaskFormData';
import { OngoingTasks } from './components'; // CHANGED
import PreviewModal from '@/features/educator-experience/components/TaskCreation/PreviewModal';
import PublishConfirmModal from '@/features/educator-experience/components/TaskCreation/PublishConfirmModal';
import SubmissionDetailsModal from '@/features/educator-experience/components/SubmissionDetails/SubmissionDetailsModal';
import TaskScheduleModal from '@/features/educator-experience/components/TaskCreation/TaskScheduleModal';
import TaskCreationSlogan from '@/features/educator-experience/components/TaskCreation/TaskCreationSlogan';
import { ensureRole, getMe } from '@/services/authApi';
import { generateAITask, convertAITaskToFormData, convertFormDataToAiTask } from '@/services/aiTaskCreation';
import { createDraft, replaceSections, updateTaskMain, publishTask, closeTask, listTasks, TaskListItem, getTaskForm, getTaskEnrollments, getTaskSubmissions, gradeSubmission } from '@/services/taskApi';
import SimpleToast from '@/shared/components/ui/SimpleToast';

const getDisplayName = (user: any) => {
  if (!user) return null; // Return null instead of 'User' - let UI handle empty state
  const rawFull = (user.full_name || user.name)?.toString().trim();
  if (rawFull) return rawFull;
  // Return email if available, otherwise null - UI should handle display
  return user.email || null;
};

export default function EducatorDashboard() {
  // CHANGED: Sidebar/UI state, mirrors App.tsx usage
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showingLayout3, setShowingLayout3] = useState(false); // CHANGED: toggle review/manage view
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // CHANGED

  // CHANGED: Data required by OngoingTasks
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [avgClarityScore, setAvgClarityScore] = useState<number | null>(null);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(defaultTaskFormData);
  const [educatorSubmissions, setEducatorSubmissions] = useState<EducatorSubmissionsMap>({});
  const [approvedGrades, setApprovedGrades] = useState<ApprovedGradesMap>({});
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string; role?: string }>();
  const [formKey, setFormKey] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledStart, setScheduledStart] = useState<Date | null>(null);
  const [scheduledEnd, setScheduledEnd] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmissionModal, setSelectedSubmissionModal] = useState<StudentSubmission | null>(null);
  // DB task id (UUID) for updates/publish; never use placeholder UI id
  const [dbTaskId, setDbTaskId] = useState<string | null>(null);
  // Confirm modal for publishing without due date
  const [showNoDueDateModal, setShowNoDueDateModal] = useState(false);
  // Show share link block when published
  const [showTaskLink, setShowTaskLink] = useState(false);
  // Current task share link (if published)
  const [taskLink, setTaskLink] = useState<string | null>(null);
  const BACKEND_URL = getBackendUrl();
  const [toast, setToast] = useState<{ message: string; kind?: 'info' | 'success' | 'error'; position?: 'top-right' | 'center' } | null>(null);
  
  // Helper function to show toast notifications
  const onNotify = (message: string, kind?: 'info' | 'success' | 'error') => {
    setToast({ message, kind });
  };
  const [isModifying, setIsModifying] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pendingAccessCode, setPendingAccessCode] = useState<string>('');
  const [showModifyPreview, setShowModifyPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'append'|'reorder'|'replace'>('append');
  const [previewBeforeSteps, setPreviewBeforeSteps] = useState<string[]>([]);
  const [previewAfterSteps, setPreviewAfterSteps] = useState<string[]>([]);
  const [previewAddedSteps, setPreviewAddedSteps] = useState<string[]>([]);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const router = useRouter();

  const [dbSidebarTasks, setDbSidebarTasks] = useState<Task[]>([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  const allTasks = useMemo(() => dbSidebarTasks, [dbSidebarTasks]);
  const publishButtonLabel = useMemo(() => {
    if (selectedTask?.isArchived) return 'Reopen Task';
    if (selectedTask?.isDraft || !dbTaskId) return 'Publish Task';
    return 'Publish Changes';
  }, [selectedTask, dbTaskId]);

  function parseAiFeedbackRaw(raw: any): { overall?: 'pass' | 'fail'; summary?: string; criteria?: Array<any>; details: string[] } {
    const details: string[] = [];
    if (!raw) return { details };
    try {
      if (typeof raw === 'object') {
        const j = raw;
        const overall = typeof j.overall === 'string' ? (j.overall.toLowerCase() as any) : undefined;
        const summary = typeof j.summary === 'string' ? j.summary : undefined;
        const criteria = Array.isArray(j.criteria) ? j.criteria : undefined;
        if (summary) details.push(summary);
        if (criteria) {
          for (const c of criteria) {
            const name = c?.name || 'Criterion';
            const level = c?.level || '';
            const comment = c?.comment || '';
            const improvement = c?.improvement || '';
            const segs = [`${name}: ${level}`];
            if (comment) segs.push(comment);
            if (improvement) segs.push(`Improvement: ${improvement}`);
            details.push(segs.join(' — '));
          }
        }
        return { overall, summary, criteria, details };
      }

      let txt = String(raw);
      // Try to extract the first fenced JSON block anywhere in the text
      const fence = txt.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fence && fence[1]) {
        txt = fence[1];
      }
      txt = txt.trim();
      // If still not fenced, but looks like JSON, parse it
      if (!fence && !/^[\[{]/.test(txt)) {
        // try to find first { ... last }
        const first = txt.indexOf('{');
        const last = txt.lastIndexOf('}');
        if (first >= 0 && last > first) txt = txt.slice(first, last + 1);
      }
      const j = JSON.parse(txt);
      const overall = typeof j.overall === 'string' ? (j.overall.toLowerCase() as any) : undefined;
      const summary = typeof j.summary === 'string' ? j.summary : undefined;
      const criteria = Array.isArray(j.criteria) ? j.criteria : undefined;
      if (summary) details.push(summary);
      if (criteria) {
        for (const c of criteria) {
          const name = c?.name || 'Criterion';
          const level = c?.level || '';
          const comment = c?.comment || '';
          const improvement = c?.improvement || '';
          const segs = [`${name}: ${level}`];
          if (comment) segs.push(comment);
          if (improvement) segs.push(`Improvement: ${improvement}`);
          details.push(segs.join(' — '));
        }
      }
      return { overall, summary, criteria, details };
    } catch (e) {
      const s = String(raw || '').replace(/```/g, '').slice(0, 500);
      if (s) details.push(s);
      return { details };
    }
  }

  // CHANGED: Clicking a task -> enter OngoingTasks (can extend for ClosedTaskReview later)
  const handleTaskClick = async (task: Task) => {
    try {
      setSelectedTask(task);
      setShowingLayout3(true);
      setAvgClarityScore(null); // Reset clarity score when switching tasks
      // Ensure form components remount to avoid stale internal state
      setFormKey((k) => k + 1);
      const isDbId = typeof task.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id as any);
      if (!isDbId) {
        setDbTaskId(null);
        setShowTaskLink(false);
        setTaskLink(null);
        setSubmissions([]);
        return;
      }

      const taskId = task.id as string;
      const r = await getTaskForm(taskId);
      if (r?.ok && r.ai_task) {
        const form = convertAITaskToFormData(r.ai_task);
        setFormKey((k) => k + 1);
        setTaskFormData(form);
        setDbTaskId(taskId);
        setShowTaskLink(Boolean(r.task?.link));
        setTaskLink(r.task?.link || null);
        
        // Load schedule from database
        if (r.task?.opens_at) {
          setScheduledStart(new Date(r.task.opens_at));
        } else {
          setScheduledStart(null);
        }
        if (r.task?.due_at) {
          const end = new Date(r.task.due_at);
          setScheduledEnd(end);
          const days = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          setSelectedTask((prev) => (prev ? { ...prev, dueDate: days, dueAt: end.toISOString() } : prev));
        } else {
          setScheduledEnd(null);
        }
      }

      try {
        const sub = await getTaskSubmissions(taskId);
        // Capture average clarity score from API response
        if (sub?.avg_clarity_score !== undefined) {
          setAvgClarityScore(sub.avg_clarity_score);
        }
        if (sub?.ok && Array.isArray(sub.submissions) && sub.submissions.length > 0) {
          const newEducatorSubmissions: EducatorSubmissionsMap = {};
          const newApprovedGrades: ApprovedGradesMap = {};
          
          const mapped = sub.submissions.map((s: any, idx: number) => {
            const studentName =
              (s.student?.name ?? '').toString().trim() ||
              (s.student?.email || null);
            const parsed = parseAiFeedbackRaw(s.ai_feedback);
            const aiOverall =
              typeof s.ai_score === 'number'
                ? (s.ai_score >= 60 ? 'pass' : 'fail')
                : (parsed.overall || 'pending');
            const details = parsed.details;
            const attachments = (Array.isArray(s.assets) ? s.assets : []).map((a: any) => {
              const rawUrl = (a.url || '').toString().trim();
              const hasScheme = /^https?:\/\//i.test(rawUrl);
              let href: string | undefined;
              if (rawUrl) {
                href = hasScheme ? rawUrl : `https://${rawUrl}`;
              } else if (a.storage_key && a.id && s.id) {
                href = `${BACKEND_URL}/api/submissions/${s.id}/assets/${a.id}/download`;
              }
              const lower = (href || '').toLowerCase();
              return {
                type: lower.includes('github.com') ? 'github' : 'pdf',
                name: a.file_name || rawUrl || 'attachment',
                size: '',
                href,
              };
            });
            
            // Build educator submissions map from backend data
            const submissionId = idx + 1; // Use mapped ID
            if (s.educator_score !== null && s.educator_score !== undefined) {
              const grade = s.educator_score >= 60 ? 'pass' : 'fail';
              newEducatorSubmissions[submissionId] = {
                grade: grade as 'pass' | 'fail',
                feedback: s.educator_feedback || '',
                submittedAt: s.graded_at ? new Date(s.graded_at) : new Date(),
              };
              // If status is 'graded', mark as approved
              if (s.status === 'graded') {
                newApprovedGrades[submissionId] = true;
              }
            }
            
            return {
              id: submissionId,
              backendId: s.id, // Store actual backend ID
              studentName,
              studentAvatarUrl: s.student?.picture || undefined,
              submissionDate: new Date(s.submitted_at || s.graded_at || Date.now()).toISOString(),
              status: (s.status || 'pending') as any,
              aiAssessment: { overall: aiOverall as any, details },
              attachments,
              studentNote: String(s.notes || ''),
            } as StudentSubmission;
          });
          setSubmissions(mapped);
          setEducatorSubmissions(newEducatorSubmissions);
          setApprovedGrades(newApprovedGrades);
          // Reset clarity score if no submissions
          if (mapped.length === 0) {
            setAvgClarityScore(null);
          }
        } else {
          const enr = await getTaskEnrollments(taskId);
          setAvgClarityScore(null);
          if (enr?.ok && Array.isArray(enr.enrollments)) {
              const mapped = enr.enrollments.map((e, idx) => ({
              id: idx + 1,
              studentName: (e.name ?? '').toString().trim() || (e.email || null),
              submissionDate: new Date(e.enrolled_at).toISOString(),
              status: 'pending' as const,
              aiAssessment: { overall: 'pending' as any, details: [] },
              attachments: [],
              studentNote: '',
            }));
            setSubmissions(mapped);
          } else {
            setSubmissions([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load submissions/enrollments for task', err);
        setSubmissions([]);
      }
    } catch (e) {
      console.error('Failed to load task form', e);
    }
  };
  const handlePromptSubmit = async () => {
    const prompt = (taskInput || '').trim();
    console.log('[EducatorDashboard] handlePromptSubmit prompt:', prompt);
    if (!prompt) { console.warn('[EducatorDashboard] Empty prompt; abort'); return; }
    try {
      setIsGenerating(true);
      const ai = await generateAITask(prompt);
      console.log('[EducatorDashboard] AI response success?:', ai.success, 'has task?:', Boolean(ai.task), 'error:', ai.error);
      if (ai.success && ai.task) {
        const form = convertAITaskToFormData(ai.task);
        console.log('[EducatorDashboard] Converted form keys:', Object.keys(form));
        setFormKey((k) => k + 1); // force a clean form mount (avoid mixing previous rubric)
        setTaskFormData(form);
        // Ensure layout 3 has a selected task context
        const title = form.title || null;
        const placeholderTask = {
          id: Number(Date.now()),
          title,
          dueDate: 0,
          dueAt: null,
          submissions: 0,
          timeLeft: '',
          clarityScore: 0,
          isDraft: true,
          formData: form,
        } as Task;
        setSelectedTask(placeholderTask);
        setSubmissions([]);
        // Reset DB id since this is a brand-new, unsaved draft in UI
        setDbTaskId(null);
        setShowingLayout3(true);
        console.log('[EducatorDashboard] Showing layout3 with task:', title);
      } else {
        console.error('AI generation failed:', ai.error);
      }
    } catch (e) {
      console.error('AI generation error', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // CHANGED: Auth0 logout requires absolute returnTo URL that is whitelisted in Auth0 settings
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin; // e.g., http://localhost:3000
      // Redirect to a protected page which will push to /api/auth/login
      // via useUser guard, avoiding the need for a local login route.
      const returnTo = encodeURIComponent(`${origin}/`);
      window.location.href = `/api/auth/logout?returnTo=${returnTo}`;
    }
  };

  const handleReturnToBuilder = () => {
    setShowingLayout3(false);
    setSelectedTask(null);
    setIsSidebarMinimized(false);
  };

  const handleSwitchToStudent = async () => {
    try {
      setIsSwitchingRole(true);
      const res = await ensureRole('student');
      if (res?.ok === false) throw new Error(res?.error || 'role error');
      router.push('/student-experience');
    } catch (error) {
      console.error('Failed to switch to student role', error);
      setToast({ message: 'Could not open learner experience right now.', kind: 'error' });
    } finally {
      setIsSwitchingRole(false);
    }
  };

  useEffect(() => {
    let alive = true;
    // Fetch logged-in user to populate sidebar profile
    (async () => {
      try {
        // Ensure user has teacher role before loading educator dashboard
        console.log('[EducatorDashboard] Ensuring teacher role...');
        const roleResult = await ensureRole('teacher');
        if (!alive) return;
        if (!roleResult?.ok) {
          console.error('[EducatorDashboard] Failed to ensure teacher role:', roleResult);
        } else {
          console.log('[EducatorDashboard] Teacher role ensured');
        }
        
        const me = await getMe();
        if (!alive || !me?.ok) return;
        const u = me.user || {};
        const name = getDisplayName(u);
        // Get role from backend response (primary_role or first role in roles array)
        const userRole = u.primary_role || (u.roles && Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : null);
        setUserProfile({ name, avatar: u.picture, role: userRole || null });
      } catch (e) {
        console.error('Failed to load user profile for sidebar', e);
      }
    })();

    // Load DB drafts/published tasks for sidebar
    (async () => {
      try {
        const r = await listTasks();
        if (!alive || !r?.ok) return;
        const now = new Date();
        const mapped: Task[] = (r.tasks || []).map((t: TaskListItem) => {
          const due = t.due_at ? new Date(t.due_at) : null;
          const dueDays = due ? Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
          const isArchived = t.status === 'archived';
          return {
            id: t.id, // DB UUID
            title: t.task_title || 'Untitled task',
            dueDate: dueDays,
            dueAt: due ? due.toISOString() : null,
            opensAt: t.opens_at || null,
            updatedAt: t.updated_at || null,
            submissions: t.submission_count ?? 0,
            timeLeft: '',
            clarityScore: t.avg_clarity_score ?? undefined,
            isDraft: t.status === 'draft',
            isArchived,
          } as Task;
        });
        setDbSidebarTasks(mapped);
      } catch (e) {
        console.error('Failed to load tasks list', e);
      } finally {
        if (alive) setIsSidebarLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const refreshProfile = async () => {
    try {
        const me = await getMe();
        if (!me?.ok) return;
        const u = me.user || {};
        const name = getDisplayName(u);
        // Get role from backend response (primary_role or first role in roles array)
        const userRole = u.primary_role || (u.roles && Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : null);
        setUserProfile({ name, avatar: u.picture, role: userRole || null });
    } catch (e) {
      // ignore refresh error
    }
  };

  // CHANGED: Main panel (landing vs OngoingTasks after a task is selected)
  // Helper to refresh DB task list in sidebar (after publish/save)
  const refreshDbSidebar = async () => {
    const shouldShowLoading = dbSidebarTasks.length === 0;
    if (shouldShowLoading) setIsSidebarLoading(true);
    try {
      const r = await listTasks();
      if (!r?.ok) return;
      const now = new Date();
        const mapped: Task[] = (r.tasks || []).map((t: TaskListItem) => {
        const due = t.due_at ? new Date(t.due_at) : null;
        const dueDays = due ? Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
        const isArchived = t.status === 'archived';
        return {
          id: t.id,
          title: t.task_title || 'Untitled task',
          dueDate: dueDays,
          dueAt: due ? due.toISOString() : null,
          opensAt: t.opens_at || null,
          updatedAt: t.updated_at || null,
          submissions: t.submission_count ?? 0,
          timeLeft: '',
          clarityScore: t.avg_clarity_score ?? undefined,
          isDraft: t.status === 'draft',
          isArchived,
        } as Task;
      });
      setDbSidebarTasks(mapped);
    } catch (e) {
      console.error('Failed to refresh tasks list', e);
    } finally {
      if (shouldShowLoading) setIsSidebarLoading(false);
    }
  };

  // Core publish flow reused by modal
const publishNow = async () => {
    try {
      setIsPublishing(true);
      // Prefer persisted DB UUID
      let taskId = dbTaskId;
      const ai_task = convertFormDataToAiTask(taskFormData);
      if (!taskId) {
        // Create an initial draft in DB, then publish
        const created = await createDraft({
          ai_task,
          opens_at: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          due_at: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
          study_link: null,
          access_code: (pendingAccessCode || '').trim() || null,
        });
        if (created?.ok && created.task_id) {
          taskId = created.task_id as string;
          setDbTaskId(taskId);
          // Capture link if provided by backend
          if (created.link) {
            setTaskLink(created.link);
          }
          setSelectedTask((prev) => prev ? { ...prev, id: created.task_id as any, isDraft: false } : prev);
        } else {
          throw new Error('Failed to create draft before publish');
        }
      }
      // Always ensure latest content is saved before publish (even if draft was just created)
      if (taskId) {
        await updateTaskMain(taskId, {
          task_title: taskFormData.title,
          objective: taskFormData.objective,
          duration: taskFormData.duration,
          level: taskFormData.levelOfTask,
          academic_integrity: taskFormData.academicIntegrity,
          opens_at: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          due_at: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
          access_code: (pendingAccessCode || '').trim() || null,
        });
        await replaceSections(taskId, ai_task);
      }
      if (taskId) {
        const pub = await publishTask(taskId);
        console.log('[Publish] link:', pub?.link);
        setToast({ message: pub?.link ? `Published link: ${pub.link}` : 'Published', kind: 'success' });
        setShowTaskLink(Boolean(pub?.link));
        setTaskLink(pub?.link || null);
        // mark selected task as non-draft and update due indicator
        setSelectedTask((prev) => prev ? { ...prev, isDraft: false, dueDate: scheduledEnd ? Math.max(0, Math.ceil(((scheduledEnd as Date).getTime() - Date.now()) / (1000*60*60*24))) : 36500, dueAt: scheduledEnd ? (scheduledEnd as Date).toISOString() : null } : prev);
        await refreshDbSidebar();
      }
    } catch (e) {
      console.error('Publish error', e);
    } finally {
      setIsPublishing(false);
    }
  };

  const mainDashboard = (
    showingLayout3 && selectedTask ? (
      <OngoingTasks
        key={formKey}
        taskTitle={selectedTask.title}
        submissions={submissions}
        taskFormData={taskFormData}
        avgClarityScore={avgClarityScore}
        onTaskFormChange={setTaskFormData}
        formKey={formKey}
        modifyLoading={isModifying}
        onPublishTask={async (_data) => {
          // Always use unified publish modal; it can handle Open task vs Scheduled
          // If no task exists in DB yet, create draft first to generate link
          if (!dbTaskId) {
            try {
              const ai_task = convertFormDataToAiTask(taskFormData);
              const created = await createDraft({
                ai_task,
                opens_at: scheduledStart ? new Date(scheduledStart).toISOString() : null,
                due_at: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
                study_link: null,
                access_code: null,
              });
              if (created?.ok && created.task_id) {
                setDbTaskId(created.task_id as string);
                if (created.link) {
                  setTaskLink(created.link);
                  setShowTaskLink(true);
                }
                setSelectedTask((prev) => prev ? { ...prev, id: created.task_id as any } : prev);
              }
            } catch (e) {
              console.error('Failed to create draft before publish modal:', e);
            }
          } else if (!taskLink) {
            // Task exists but link not in state - fetch it
            try {
              const taskData = await getTaskForm(dbTaskId);
              if (taskData?.ok && taskData?.task?.link) {
                setTaskLink(taskData.task.link);
                setShowTaskLink(true);
              }
            } catch (e) {
              console.warn('Failed to fetch task link:', e);
            }
          }
          setShowPublishModal(true);
        }}
        onModifyTask={async (message: string) => {
          try {
            setIsModifying(true);
            const spec = (message || '').trim();
            if (!spec) return;
            // Compose spec with current task context to keep the same theme
            const prev = taskFormData; // capture current form before building context
            const contextSpec = [
              'Task context (do not change title or objective):',
              `Title: ${prev.title || ''}`,
              `Objective: ${prev.objective || ''}`,
              'Current instructions:',
              (Array.isArray(prev.steps) && prev.steps.length)
                ? prev.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
                : '(none)',
              '',
              'Teacher request:',
              spec,
              '',
              'Return the same JSON schema. Keep title/objective unchanged. For instructions, propose additions that fit the context.'
            ].join('\n');
            const res: any = await generateAITask(contextSpec);
            if (!res || !res.task) {
              setToast({ message: 'No changes returned by Hens', kind: 'info' });
              return;
            }

            // Convert AI → form shape, then selectively apply ONLY section fields.
            const aiForm = convertAITaskToFormData(res.task);
            const next = { ...prev } as typeof taskFormData;

            const changed: string[] = [];
            const apply = <K extends keyof typeof next>(key: K, label: string, value: any) => {
              const before = JSON.stringify((prev as any)[key] ?? null);
              const after = JSON.stringify(value ?? null);
              if (before !== after) {
                (next as any)[key] = value;
                changed.push(label);
              }
            };

            // Sections we allow Hens to update automatically
            // For steps, append AI-proposed steps after existing list (smart de-dup, capped additions)
            {
              const aiStepsRaw = (aiForm as any).steps ?? (aiForm as any).instructions ?? [];
              const aiSteps = Array.isArray(aiStepsRaw) ? aiStepsRaw.map((s: any) => String(s || '').trim()).filter(Boolean) : [];
              const prevSteps = Array.isArray((prev as any).steps) ? (prev as any).steps.slice() : [];
              const normalize = (s: string) => s
                .toLowerCase()
                .replace(/^\s*[\divx]+[\)\].:\-]\s*/i, '')  // strip leading numbering like "1.", "a)", etc.
                .replace(/[\s\.;,!]+$/g, '')                  // trim trailing punctuation/spaces
                .replace(/\s+/g, ' ')                          // collapse spaces
                .trim();
              const existing = new Set(prevSteps.map((s: any) => normalize(String(s))));
              const toAdd: string[] = [];
              const addedNorm = new Set<string>();
              const MAX_ADD = 3;
              for (const s of aiSteps) {
                if (toAdd.length >= MAX_ADD) break;
                const key = normalize(s);
                if (!key) continue;
                if (!existing.has(key) && !addedNorm.has(key)) {
                  addedNorm.add(key);
                  toAdd.push(s);
                }
              }
              const merged = prevSteps.concat(toAdd);
              apply('steps' as any, `Instructions${toAdd.length ? ` (+${toAdd.length})` : ''}`, merged);
              if (toAdd.length) {
                changed.push(`New steps: ${toAdd.map((s) => `"${s}"`).join('; ')}`);
              }
            }
            apply('expectedOutputs' as any, 'Expected Output', (aiForm as any).expectedOutputs ?? (aiForm as any).expected_output ?? []);
            // Resources: append new items (URL-aware de-dup), cap additions
            {
              const aiRaw = (aiForm as any).resources ?? [];
              const aiItems = Array.isArray(aiRaw) ? aiRaw.map((s: any) => String(s || '').trim()).filter(Boolean) : [];
              const prevItems = Array.isArray((prev as any).resources) ? (prev as any).resources.slice() : [];
              const norm = (s: string) => {
                const url = (s.match(/https?:\/\/\S+/i) || [])[0] || '';
                const key = (url ? url : s).toLowerCase().replace(/[\s\.;,!]+$/g, '').trim();
                return key;
              };
              const existing = new Set(prevItems.map((s: any) => norm(String(s))));
              const toAdd: string[] = [];
              const added = new Set<string>();
              const MAX_ADD = 3;
              for (const s of aiItems) {
                if (toAdd.length >= MAX_ADD) break;
                const key = norm(s);
                if (!key) continue;
                if (!existing.has(key) && !added.has(key)) {
                  added.add(key);
                  toAdd.push(s);
                }
              }
              const merged = prevItems.concat(toAdd);
              apply('resources' as any, `Resources${toAdd.length ? ` (+${toAdd.length})` : ''}`, merged);
              if (toAdd.length) changed.push(`New resources: ${toAdd.map((s) => `"${s}"`).join('; ')}`);
            }
            apply('reflectionQuestions' as any, 'Reflection', (aiForm as any).reflectionQuestions ?? []);
            apply('assessmentCriteria' as any, 'Assessment Criteria', (aiForm as any).assessmentCriteria ?? []);
            apply('rubric' as any, 'Rubric', (aiForm as any).rubric ?? []);
            apply('supportHints' as any, 'Support & Hints', (aiForm as any).supportHints ?? []);

            // DO NOT update title/objective (and other header fields) unless explicitly requested.
            // next.title = prev.title; next.objective = prev.objective; // implicitly preserved by spreading prev

            setTaskFormData(next);
            const msg = changed.length
              ? `Updated: ${changed.join(', ')} (title/objective unchanged)`
              : 'No section changed (title/objective unchanged)';
            setToast({ message: msg, kind: 'success' });
          } catch (e) {
            console.error('AI modify error', e);
            setToast({ message: 'Failed to modify via Hens', kind: 'error' });
          } finally {
            setIsModifying(false);
          }
        }}
        onPreview={() => setShowPreview(true)}
        onSaveDraft={async () => {
          try {
            const ai_task = convertFormDataToAiTask(taskFormData);
            let taskId = dbTaskId;
            if (!taskId) {
              // First save: create the draft only and stop (avoid falling through to PUT)
              const created = await createDraft({
                ai_task,
                opens_at: scheduledStart ? new Date(scheduledStart).toISOString() : null,
                due_at: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
              });
              if (created?.ok && created.task_id) {
                taskId = created.task_id as string;
                setDbTaskId(taskId);
                // Capture link if provided by backend (link is generated immediately on task creation)
                if (created.link) {
                  setTaskLink(created.link);
                  setShowTaskLink(true);
                }
                setSelectedTask((prev) => prev ? { ...prev, id: created.task_id as any } : prev);
                console.log('[Draft] created', created.task_id, 'link:', created.link);
            setToast({ message: 'Draft saved', kind: 'success', position: 'center' });
                await refreshDbSidebar();
                return; // do not proceed to PUT on first save
              } else {
                throw new Error('Failed to create draft');
              }
            } else {
              await updateTaskMain(taskId, {
                task_title: taskFormData.title,
                objective: taskFormData.objective,
                duration: taskFormData.duration,
                level: taskFormData.levelOfTask,
                academic_integrity: taskFormData.academicIntegrity,
                opens_at: scheduledStart ? new Date(scheduledStart).toISOString() : null,
                due_at: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
              });
              await replaceSections(taskId, ai_task);
              setToast({ message: 'Draft updated', kind: 'success', position: 'center' });
              await refreshDbSidebar();
            }
          } catch (e) {
            console.error('Save draft error', e);
          }
        }}
        onTaskSchedule={() => setShowSchedule(true)}
        onSubmissionClick={(sub) => { setSelectedSubmissionModal(sub); setShowSubmissionModal(true); }}
        educatorSubmissions={educatorSubmissions}
        approvedGrades={approvedGrades}
        hideSubmissionsPanel={selectedTask?.isDraft === true}
        scheduledStart={scheduledStart}
        scheduledEnd={scheduledEnd}
        showTaskLink={showTaskLink}
        taskLink={taskLink}
        onBackToMain={handleReturnToBuilder}
        onCloseTask={async () => {
          if (!dbTaskId) {
            setToast({ message: 'No task selected to close', kind: 'error' });
            return;
          }
          try {
            const result = await closeTask(dbTaskId);
            if (result?.ok) {
              setToast({ message: 'Task closed successfully', kind: 'success' });
              // Return to main dashboard
              setShowingLayout3(false);
              setSelectedTask(null);
              await refreshDbSidebar();
            } else {
              setToast({ message: result?.error || 'Failed to close task', kind: 'error' });
            }
          } catch (e) {
            console.error('Close task error', e);
            setToast({ message: 'Failed to close task', kind: 'error' });
          }
        }}
        publishLabel={publishButtonLabel}
        onNotify={(message, kind) => setToast({ message, kind })}
      />
    ) : (
    <Layout1>
      <div className="flex flex-col items-center justify-center px-8 py-16 gap-16 w-full">
        <TaskCreationSlogan />
        <div className="w-full flex flex-col items-center gap-8">
        <AInputBox
          value={taskInput}
          onChange={setTaskInput}
          onSubmit={handlePromptSubmit}
          placeholder="Describe your task shortly"
          maxWidth="2200px"
          disabled={isGenerating}
        />
          <p className="text-gray-500 text-[18px] text-center max-w-2xl">
            The more detailed description, as precise the result. Even a simple start like; "I want my learners to understand [topic]" is enough.
        </p>
        </div>
      </div>
    </Layout1>
    )
  );

  // CHANGED: Wrap with MainLayout to provide Sidebar (tasks, search, expand/minimize)
  // CHANGED: allow expanding even in review view (remove row-click-to-navigate override)
  return (
    <>
      {toast && (
        <SimpleToast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />
      )}
      <MainLayout
        mainDashboard={mainDashboard}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized((prev) => !prev)}
        tasks={allTasks}
        onTaskClick={handleTaskClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userProfile={userProfile}
        onLogout={handleLogout} // CHANGED: pass logout to Sidebar
        onProfileUpdated={refreshProfile}
        audience="educator"
        isTasksLoading={isSidebarLoading}
        isLoading={isGenerating || isModifying || isPublishing}
      />
      {/* Preview modal (student view) */}
      {showingLayout3 && (
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          taskData={taskFormData}
          onPublish={async () => {
            setShowPreview(false);
            // If no task exists in DB yet, create draft first to generate link
            if (!dbTaskId) {
              try {
                const ai_task = convertFormDataToAiTask(taskFormData);
                const created = await createDraft({
                  ai_task,
                  opens_at: scheduledStart ? new Date(scheduledStart).toISOString() : null,
                  due_at: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
                  study_link: null,
                  access_code: null,
                });
                if (created?.ok && created.task_id) {
                  setDbTaskId(created.task_id as string);
                  if (created.link) {
                    setTaskLink(created.link);
                    setShowTaskLink(true);
                  }
                  setSelectedTask((prev) => prev ? { ...prev, id: created.task_id as any } : prev);
                }
              } catch (e) {
                console.error('Failed to create draft before publish modal:', e);
              }
            } else if (!taskLink) {
              // Task exists but link not in state - fetch it
              try {
                const taskData = await getTaskForm(dbTaskId);
                if (taskData?.ok && taskData?.task?.link) {
                  setTaskLink(taskData.task.link);
                  setShowTaskLink(true);
                }
              } catch (e) {
                console.warn('Failed to fetch task link:', e);
              }
            }
            setShowPublishModal(true);
          }}
        />
      )}

      {/* Task Schedule modal */}
      {showingLayout3 && (
        <TaskScheduleModal
          isOpen={showSchedule}
          onClose={() => setShowSchedule(false)}
          initialStartDate={scheduledStart}
          initialEndDate={scheduledEnd}
          onSave={async (start, end) => {
            setScheduledStart(start);
            setScheduledEnd(end);
            // Update sidebar due indicator for the draft (if present)
            if (end && selectedTask) {
              const now = new Date();
              const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              setSelectedTask({ ...selectedTask, dueDate: days, dueAt: end.toISOString() });
            }
            
            // Save schedule to database immediately if task exists
            if (dbTaskId) {
              try {
                await updateTaskMain(dbTaskId, {
                  opens_at: start ? new Date(start).toISOString() : null,
                  due_at: end ? new Date(end).toISOString() : null,
                });
                console.log('[EducatorDashboard] Schedule saved to database');
              } catch (error) {
                console.error('[EducatorDashboard] Failed to save schedule:', error);
                // Still update UI even if DB save fails
              }
            }
          }}
        />
      )}

      {/* Submission details (educator grading) */}
      {showingLayout3 && (
        <SubmissionDetailsModal
          isOpen={showSubmissionModal}
          onClose={() => setShowSubmissionModal(false)}
          selectedSubmission={selectedSubmissionModal as any}
          educatorSubmission={selectedSubmissionModal ? educatorSubmissions[selectedSubmissionModal.id] : undefined}
          isGradeApproved={selectedSubmissionModal ? approvedGrades[selectedSubmissionModal.id] || false : false}
          onApproveGrade={async (grade: 'pass' | 'fail', feedback?: string) => {
            if (!selectedSubmissionModal) return;
            try {
              // Use the backendId if available, otherwise find it
              const backendSubmissionId = selectedSubmissionModal.backendId;
              if (!backendSubmissionId) {
                // Fallback: find by student name
                const sub = await getTaskSubmissions(dbTaskId!);
                if (sub?.ok && Array.isArray(sub.submissions)) {
                  const backendSubmission = sub.submissions.find((s: any) => {
                    const studentName = (s.student?.name ?? '').toString().trim() || (s.student?.email || null);
                    return studentName === selectedSubmissionModal.studentName;
                  });
                  if (!backendSubmission?.id) {
                    onNotify?.('Submission not found', 'error');
                    return;
                  }
                  const educatorScore = grade === 'pass' ? 60 : 0;
                  // Include feedback if provided, otherwise don't send it to preserve existing
                  const payload: any = {
                    educator_score: educatorScore,
                    status: 'graded'
                  };
                  if (feedback && feedback.trim()) {
                    payload.educator_feedback = feedback.trim();
                  }
                  await gradeSubmission(backendSubmission.id.toString(), payload);
                } else {
                  onNotify?.('Failed to find submission', 'error');
                  return;
                }
              } else {
                // Use the stored backendId
                const educatorScore = grade === 'pass' ? 60 : 0;
                // Include feedback if provided, otherwise don't send it to preserve existing
                const payload: any = {
                  educator_score: educatorScore,
                  status: 'graded'
                };
                if (feedback && feedback.trim()) {
                  payload.educator_feedback = feedback.trim();
                }
                await gradeSubmission(backendSubmissionId, payload);
              }
              
              // Update local state immediately for instant UI feedback
              const submissionId = selectedSubmissionModal.id;
              setEducatorSubmissions(prev => ({
                ...prev,
                [submissionId]: {
                  grade,
                  feedback: feedback || '',
                  submittedAt: new Date(),
                }
              }));
              setApprovedGrades(prev => ({
                ...prev,
                [submissionId]: true
              }));
              
              // Refresh submissions to get latest data from backend
              if (dbTaskId) {
                const updated = await getTaskSubmissions(dbTaskId);
                if (updated?.ok && Array.isArray(updated.submissions)) {
                  // Rebuild educator submissions and approved grades
                  const newEducatorSubmissions: EducatorSubmissionsMap = {};
                  const newApprovedGrades: ApprovedGradesMap = {};
                  updated.submissions.forEach((s: any, idx: number) => {
                    const submissionId = idx + 1;
                    if (s.educator_score !== null && s.educator_score !== undefined) {
                      const grade = s.educator_score >= 60 ? 'pass' : 'fail';
                      newEducatorSubmissions[submissionId] = {
                        grade: grade as 'pass' | 'fail',
                        feedback: s.educator_feedback || '',
                        submittedAt: s.graded_at ? new Date(s.graded_at) : new Date(),
                      };
                      if (s.status === 'graded') {
                        newApprovedGrades[submissionId] = true;
                      }
                    }
                  });
                  setEducatorSubmissions(newEducatorSubmissions);
                  setApprovedGrades(newApprovedGrades);
                }
              }
              
              setShowSubmissionModal(false);
              onNotify?.('Grade approved successfully', 'success');
            } catch (error) {
              console.error('Failed to approve grade:', error);
              onNotify?.('Failed to approve grade. Please try again.', 'error');
            }
          }}
          onEducatorSubmission={async (grade: string, feedback: string) => {
            if (!selectedSubmissionModal) return;
            try {
              // Use the backendId if available, otherwise find it
              const backendSubmissionId = selectedSubmissionModal.backendId;
              if (!backendSubmissionId) {
                // Fallback: find by student name
                const sub = await getTaskSubmissions(dbTaskId!);
                if (sub?.ok && Array.isArray(sub.submissions)) {
                  const backendSubmission = sub.submissions.find((s: any) => {
                    const studentName = (s.student?.name ?? '').toString().trim() || (s.student?.email || null);
                    return studentName === selectedSubmissionModal.studentName;
                  });
                  if (!backendSubmission?.id) {
                    onNotify?.('Submission not found', 'error');
                    return;
                  }
                  const educatorScore = grade === 'pass' ? 60 : 0;
                  // Send feedback only if it's not empty, otherwise send null to preserve existing
                  const trimmedFeedback = feedback?.trim() || null;
                  await gradeSubmission(backendSubmission.id.toString(), {
                    educator_score: educatorScore,
                    educator_feedback: trimmedFeedback,
                    status: 'graded'
                  });
                } else {
                  onNotify?.('Failed to find submission', 'error');
                  return;
                }
              } else {
                // Use the stored backendId
                const educatorScore = grade === 'pass' ? 60 : 0;
                // Send feedback only if it's not empty, otherwise send null to preserve existing
                const trimmedFeedback = feedback?.trim() || null;
                await gradeSubmission(backendSubmissionId, {
                  educator_score: educatorScore,
                  educator_feedback: trimmedFeedback,
                  status: 'graded'
                });
              }
              
              // Update local state
              const submissionId = selectedSubmissionModal.id;
              setEducatorSubmissions(prev => ({
                ...prev,
                [submissionId]: {
                  grade: grade as 'pass' | 'fail',
                  feedback,
                  submittedAt: new Date(),
                }
              }));
              setApprovedGrades(prev => ({
                ...prev,
                [submissionId]: true
              }));
              
              // Refresh submissions
              if (dbTaskId) {
                const updated = await getTaskSubmissions(dbTaskId);
                if (updated?.ok && Array.isArray(updated.submissions)) {
                  const newEducatorSubmissions: EducatorSubmissionsMap = {};
                  const newApprovedGrades: ApprovedGradesMap = {};
                  updated.submissions.forEach((s: any, idx: number) => {
                    const submissionId = idx + 1;
                    if (s.educator_score !== null && s.educator_score !== undefined) {
                      const grade = s.educator_score >= 60 ? 'pass' : 'fail';
                      newEducatorSubmissions[submissionId] = {
                        grade: grade as 'pass' | 'fail',
                        feedback: s.educator_feedback || '',
                        submittedAt: s.graded_at ? new Date(s.graded_at) : new Date(),
                      };
                      if (s.status === 'graded') {
                        newApprovedGrades[submissionId] = true;
                      }
                    }
                  });
                  setEducatorSubmissions(newEducatorSubmissions);
                  setApprovedGrades(newApprovedGrades);
                }
              }
              
              setShowSubmissionModal(false);
              onNotify?.('Grade submitted successfully', 'success');
            } catch (error) {
              console.error('Failed to submit grade:', error);
              onNotify?.('Failed to submit grade. Please try again.', 'error');
            }
          }}
        />
      )}

      {/* Removed separate no-due-date confirmation; the publish modal handles Open task */}

      {/* Publish confirm modal (optional passcode) */}
      {showPublishModal && (
        <PublishConfirmModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          scheduledText={(() => {
            const s = scheduledStart ? new Date(scheduledStart) : null;
            const e = scheduledEnd ? new Date(scheduledEnd) : null;
            if (!s && !e) return null;
            const fmt = (d: Date) => d.toLocaleDateString();
            return { start: s ? fmt(s) : 'Now', end: e ? fmt(e) : 'Open' };
          })()}
          existingLink={taskLink}
          hasSchedule={Boolean(scheduledStart || scheduledEnd)}
          onAddSchedule={() => { setShowPublishModal(false); setShowSchedule(true); }}
          onConfirm={async ({ accessCode }) => {
            setPendingAccessCode(accessCode || '');
            setShowPublishModal(false);
            // publishNow will handle publishing (draft already created if needed)
            await publishNow();
          }}
        />
      )}
    </>
  );
}
