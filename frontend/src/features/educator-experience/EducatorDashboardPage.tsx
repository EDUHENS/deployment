'use client';
/**
 * TODO LIST:
 * After db implemenate 
 * TODO(db): handleTaskClick load asign taskId 的 TaskFormData and setTaskFormData(...)
   TODO(db): replace useEffect(fetchDashboardBootstrap)，change：GET /tasks、GET /submissions、GET /tasks/:id/form
   TODO(db): design draft and publish process to backedn onTaskFormChange、onSaveDraft、onPublishTask
 */
// CHANGED: Render the educator landing view on entry
// Aligns with src/App.tsx (Sidebar tasks + centered input)
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { MainLayout, Layout1 } from '@/shared/components/layout'; // CHANGED
import { AInputBox } from '@/shared/components/forms'; // CHANGED
import type { Task, TaskFormData, StudentSubmission, EducatorSubmissionsMap, ApprovedGradesMap } from './types'; // CHANGED
import { mockTasks, defaultTaskFormData } from '@/mocks/data/tasks'; // CHANGED: Use existing project mock tasks
import { fetchDashboardBootstrap } from '@/services/api/educatorDashboard'; // CHANGED
import { OngoingTasks } from './components'; // CHANGED
import PreviewModal from '@/features/educator-experience/components/TaskCreation/PreviewModal';
import TaskScheduleModal from '@/features/educator-experience/components/TaskCreation/TaskScheduleModal';
import { getMe } from '@/services/authApi';
import { generateAITask, convertAITaskToFormData, convertFormDataToAiTask } from '@/services/aiTaskCreation';
import { createDraft, replaceSections, updateTaskMain, publishTask, listTasks, TaskListItem, getTaskForm, getTaskEnrollments } from '@/services/taskApi';

export default function EducatorDashboard() {
  // CHANGED: Sidebar/UI state, mirrors App.tsx usage
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [showingLayout3, setShowingLayout3] = useState(false); // CHANGED: toggle review/manage view
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // CHANGED

  // CHANGED: Data required by OngoingTasks
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(defaultTaskFormData);
  const [educatorSubmissions, setEducatorSubmissions] = useState<EducatorSubmissionsMap>({});
  const [approvedGrades, setApprovedGrades] = useState<ApprovedGradesMap>({});
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string; role?: string }>();
  const [formKey, setFormKey] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledStart, setScheduledStart] = useState<Date | null>(null);
  const [scheduledEnd, setScheduledEnd] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // DB task id (UUID) for updates/publish; never use placeholder UI id
  const [dbTaskId, setDbTaskId] = useState<string | null>(null);
  // Confirm modal for publishing without due date
  const [showNoDueDateModal, setShowNoDueDateModal] = useState(false);
  // Show share link block when published
  const [showTaskLink, setShowTaskLink] = useState(false);
  // Current task share link (if published)
  const [taskLink, setTaskLink] = useState<string | null>(null);

  // CHANGED: Merge policy — only show mock tasks when explicitly enabled
  const [dbSidebarTasks, setDbSidebarTasks] = useState<Task[]>([]);
  const USE_MOCK = (process.env.NEXT_PUBLIC_SHOW_MOCK_TASKS || '').toString() === '1';
  const tasks: Task[] = USE_MOCK ? mockTasks : [];
  const allTasks = useMemo(() => {
    return [...dbSidebarTasks, ...tasks];
  }, [dbSidebarTasks, tasks]);

  // CHANGED: Clicking a task -> enter OngoingTasks (can extend for ClosedTaskReview later)
  const handleTaskClick = async (task: Task) => {
    try {
      setSelectedTask(task);
      setShowingLayout3(true);
      // Ensure form components remount to avoid stale internal state
      setFormKey((k) => k + 1);
      // If this is a DB task (UUID string), load its form from backend
      const isDbId = typeof task.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id as any);
      if (isDbId) {
        const r = await getTaskForm(task.id as any);
        if (r?.ok && r.ai_task) {
          const form = convertAITaskToFormData(r.ai_task);
          setFormKey((k) => k + 1);
          setTaskFormData(form);
          setDbTaskId(task.id as any);
          setShowTaskLink(Boolean(r.task?.link));
          setTaskLink(r.task?.link || null);
          // If the DB task has due_at, reflect into sidebar days remaining
          if (r.task?.due_at) {
            const end = new Date(r.task.due_at);
            const days = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            setSelectedTask((prev) => prev ? { ...prev, dueDate: days } : prev);
          }
          // Do not treat enrollments as submissions. Keep submissions empty
          // until students actually submit work via the submissions API.
          try {
            const keepMock = (task.title || '').toLowerCase().includes('building restful apis with node.js');
            if (!keepMock) {
              const enr = await getTaskEnrollments(task.id as any);
              if (enr?.ok) {
                setSubmissions([]);
              }
            }
          } catch (err) {
            console.warn('Failed to query enrollments (ignored)', err);
          }
        }
      } else {
        // mock task clicked—keep current behavior
        setDbTaskId(null);
        setShowTaskLink(false);
        setTaskLink(null);
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
      const ai = await generateAITask(prompt);
      console.log('[EducatorDashboard] AI response success?:', ai.success, 'has task?:', Boolean(ai.task), 'error:', ai.error);
      if (ai.success && ai.task) {
        const form = convertAITaskToFormData(ai.task);
        console.log('[EducatorDashboard] Converted form keys:', Object.keys(form));
        setFormKey((k) => k + 1); // force a clean form mount (avoid mixing previous rubric)
        setTaskFormData(form);
        // Ensure layout 3 has a selected task context
        const title = form.title || 'New Task';
        const placeholderTask = {
          id: Number(Date.now()),
          title,
          dueDate: 0,
          submissions: 0,
          timeLeft: '',
          clarityScore: 0,
          isDraft: true,
          formData: form,
        } as Task;
        setSelectedTask(placeholderTask);
        // Reset DB id since this is a brand-new, unsaved draft in UI
        setDbTaskId(null);
        setShowingLayout3(true);
        console.log('[EducatorDashboard] Showing layout3 with task:', title);
      } else {
        console.error('AI generation failed:', ai.error);
      }
    } catch (e) {
      console.error('AI generation error', e);
    }
  };

  // CHANGED: Auth0 logout requires absolute returnTo URL that is whitelisted in Auth0 settings
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin; // e.g., http://localhost:3000
      // Redirect to a protected page which will push to /auth/login
      // via useUser guard, avoiding the need for a local login route.
      const returnTo = encodeURIComponent(`${origin}/`);
      window.location.href = `/auth/logout?returnTo=${returnTo}`;
    }
  };

  // CHANGED: Load bootstrap data on mount (prevents undefined submissions)
  useEffect(() => {
    let alive = true;
    fetchDashboardBootstrap()
      .then((data) => {
        if (!alive) return;
        setSubmissions(data.submissions || []);
        setTaskFormData(data.defaultTaskForm || defaultTaskFormData);
        setEducatorSubmissions(data.educatorSubmissions || {});
        setApprovedGrades(data.approvedGrades || {});
      })
      .catch((e) => console.error('Educator bootstrap failed', e));

    // Fetch logged-in user to populate sidebar profile
    (async () => {
      try {
        const me = await getMe();
        if (!alive || !me?.ok) return;
        const u = me.user || {};
        const first = u.first_name?.toString().trim();
        const last = u.last_name?.toString().trim();
        const name = [first, last].filter(Boolean).join(' ') || u.email || 'User';
        const primary = (u.primary_role || (Array.isArray(u.roles) ? u.roles[0] : '')) as string;
        const role = primary ? primary.charAt(0).toUpperCase() + primary.slice(1) : undefined;
        setUserProfile({ name, avatar: u.picture, role });
      } catch (e) {
        console.error('Failed to load user profile for sidebar', e);
      }
    })();

    // Load DB drafts/published tasks for sidebar (merge with mocks)
    (async () => {
      try {
        const r = await listTasks();
        if (!alive || !r?.ok) return;
        const now = new Date();
        const mapped: Task[] = (r.tasks || []).map((t: TaskListItem) => {
          const due = t.due_at ? new Date(t.due_at) : null;
          // No due date => treat as open task (green indicator)
          const dueDays = due ? Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 36500;
          return {
            id: t.id, // DB UUID
            title: t.task_title || 'Untitled task',
            dueDate: dueDays,
            submissions: 0,
            timeLeft: '',
            clarityScore: 0,
            isDraft: t.status !== 'published',
          } as Task;
        });
        setDbSidebarTasks(mapped);
      } catch (e) {
        console.error('Failed to load tasks list', e);
      }
    })();
    return () => { alive = false; };
  }, []);

  const refreshProfile = async () => {
    try {
      const me = await getMe();
      if (!me?.ok) return;
      const u = me.user || {};
      const first = u.first_name?.toString().trim();
      const last = u.last_name?.toString().trim();
      const name = [first, last].filter(Boolean).join(' ') || u.email || 'User';
      const primary = (u.primary_role || (Array.isArray(u.roles) ? u.roles[0] : '')) as string;
      const role = primary ? primary.charAt(0).toUpperCase() + primary.slice(1) : undefined;
      setUserProfile({ name, avatar: u.picture, role });
    } catch (e) {
      // ignore refresh error
    }
  };

  // Helper: check UUID format (avoid trying to PUT with timestamp ids)
  const isUUID = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  // CHANGED: Main panel (landing vs OngoingTasks after a task is selected)
  // Helper to refresh DB task list in sidebar (after publish/save)
  const refreshDbSidebar = async () => {
    try {
      const r = await listTasks();
      if (!r?.ok) return;
      const now = new Date();
      const mapped: Task[] = (r.tasks || []).map((t: TaskListItem) => {
        const due = t.due_at ? new Date(t.due_at) : null;
        const dueDays = due ? Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 36500;
        return {
          id: t.id,
          title: t.task_title || 'Untitled task',
          dueDate: dueDays,
          submissions: 0,
          timeLeft: '',
          clarityScore: 0,
          isDraft: t.status !== 'published',
        } as Task;
      });
      setDbSidebarTasks(mapped);
    } catch (e) {
      console.error('Failed to refresh tasks list', e);
    }
  };

  // Core publish flow reused by modal
  const publishNow = async () => {
    try {
      // Prefer persisted DB UUID
      let taskId = dbTaskId;
      const ai_task = convertFormDataToAiTask(taskFormData);
      if (!taskId) {
        // Create an initial draft in DB, then publish
        const created = await createDraft({
          ai_task,
          opens_at: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          due_at: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        });
        if (created?.ok && created.task_id) {
          taskId = created.task_id as string;
          setDbTaskId(taskId);
          setSelectedTask((prev) => prev ? { ...prev, id: created.task_id as any, isDraft: false } : prev);
        } else {
          throw new Error('Failed to create draft before publish');
        }
      } else {
        // ensure latest content is saved before publish
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
      }
      if (taskId) {
        const pub = await publishTask(taskId);
        console.log('[Publish] link:', pub?.link);
        alert(pub?.link ? `Published link: ${pub.link}` : 'Published');
        setShowTaskLink(Boolean(pub?.link));
        setTaskLink(pub?.link || null);
        // mark selected task as non-draft and update due indicator
        setSelectedTask((prev) => prev ? { ...prev, isDraft: false, dueDate: scheduledEnd ? Math.max(0, Math.ceil(((scheduledEnd as Date).getTime() - Date.now()) / (1000*60*60*24))) : 36500 } : prev);
        await refreshDbSidebar();
      }
    } catch (e) {
      console.error('Publish error', e);
    }
  };

  const mainDashboard = (
    showingLayout3 && selectedTask ? (
      <OngoingTasks
        key={formKey}
        taskTitle={selectedTask.title}
        submissions={submissions}
        taskFormData={taskFormData}
        onTaskFormChange={setTaskFormData}
        formKey={formKey}
        onPublishTask={async (_data) => {
          // If no due date selected, confirm with teacher
          if (!scheduledEnd) {
            setShowNoDueDateModal(true);
            return;
          }
          await publishNow();
        }}
        onModifyTask={(_msg) => {}}
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
                setSelectedTask((prev) => prev ? { ...prev, id: created.task_id as any } : prev);
                console.log('[Draft] created', created.task_id);
                alert('Draft saved');
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
              alert('Draft updated');
              await refreshDbSidebar();
            }
          } catch (e) {
            console.error('Save draft error', e);
          }
        }}
        onTaskSchedule={() => setShowSchedule(true)}
        onSubmissionClick={() => {}}
        educatorSubmissions={educatorSubmissions}
        approvedGrades={approvedGrades}
        hideSubmissionsPanel={selectedTask?.isDraft === true}
        scheduledStart={scheduledStart}
        scheduledEnd={scheduledEnd}
        showTaskLink={showTaskLink}
        taskLink={taskLink}
      />
    ) : (
    <Layout1>
      <div className="flex flex-col items-center justify-center px-8 py-16 gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-4">
            <Image src="/hens-main.svg" alt="Hens" width={72} height={72} className="h-16 w-16 md:h-20 md:w-20" />
            <p className="font-semibold text-[#484de6] text-2xl md:text-3xl text-center">
              Hens can turn words into comprehensive tasks
            </p>
          </div>
        </div>
        <AInputBox
          value={taskInput}
          onChange={setTaskInput}
          onSubmit={handlePromptSubmit}
          placeholder="Describe your task shortly"
          maxWidth="2200px"
          className="w-full"
        />
        <p className="text-gray-500 text-sm">
          The more detailed description, the more precise the result.
        </p>
      </div>
    </Layout1>
    )
  );

  // CHANGED: Wrap with MainLayout to provide Sidebar (tasks, search, expand/minimize)
  // CHANGED: allow expanding even in review view (remove row-click-to-navigate override)
  return (
    <>
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
      />
      {/* Preview modal (student view) */}
      {showingLayout3 && (
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          taskData={taskFormData}
          onPublish={() => { /* future: save and publish */ }}
        />
      )}

      {/* Task Schedule modal */}
      {showingLayout3 && (
        <TaskScheduleModal
          isOpen={showSchedule}
          onClose={() => setShowSchedule(false)}
          onSave={(start, end) => {
            setScheduledStart(start);
            setScheduledEnd(end);
            // Update sidebar due indicator for the draft (if present)
            if (end && selectedTask) {
              const now = new Date();
              const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              setSelectedTask({ ...selectedTask, dueDate: days });
            }
          }}
        />
      )}

      {/* Confirm publish without due date */}
      {showNoDueDateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">No due date set</h3>
            <p className="text-sm text-gray-700 mb-4">
              You have not set a due date. Publish as an open task (no due date)?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => setShowNoDueDateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
                onClick={() => { setShowNoDueDateModal(false); setShowSchedule(true); }}
              >
                Set Due Date
              </button>
              <button
                className="px-4 py-2 bg-[#484de6] text-white rounded hover:bg-[#3A3FE4]"
                onClick={async () => { setShowNoDueDateModal(false); await publishNow(); }}
              >
                Publish as Open Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
