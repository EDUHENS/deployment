'use client';

import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/shared/components/layout';
import EnrollTaskView from '../enroll/EnrollTaskView';
import StudentTaskWorkspace from '../workspace/StudentTaskWorkspace';
import StudentTaskSummary from '../summary/StudentTaskSummary';
import SubmissionSavedModal from '../Modals/SubmissionSavedModal';
import { useStudentTasks } from '../../hooks/useStudentTasks';
import type { StudentTask } from '../../types/studentTask';
import type { Task as SidebarTask } from '@/features/educator-experience/types';
//import { getMe } from '@/services/authApi';
import { getProfile } from '@/services/authApi';
import SimpleToast from '@/shared/components/ui/SimpleToast';

interface StudentDashboardProps {
  onLogout?: () => void;
}

const getDisplayName = (user: any) => {
  if (!user) return null; // Return null instead of 'User' - let UI handle empty state
  const rawFull = (user.full_name || user.name)?.toString().trim();
  if (rawFull) return rawFull;
  // Return email if available, otherwise null - UI should handle display
  return user.email || null;
};

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const { tasks, loading, enroll, saveDraft, submitTask, refresh } = useStudentTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string; role?: string }>();
  const [toast, setToast] = useState<{ message: string; kind?: 'info' | 'success' | 'error'; position?: 'top-right' | 'center' } | null>(null);

  const selectedTask: StudentTask | undefined = useMemo(
    () => tasks.find((task) => task.id === (selectedTaskId ?? '')),
    [tasks, selectedTaskId],
  );

  const [isEnrollSubmitting, setIsEnrollSubmitting] = useState(false);

  const handleEnroll = async (payload: { link: string; passcode: string }) => {
    try {
      setIsEnrollSubmitting(true);
      const newTask = await enroll(payload);
      if (newTask) {
        setSelectedTaskId(newTask.id);
      }
    } catch (error) {
      console.error('Failed to enroll in task', error);
      setToast({ message: 'Could not enroll in that task. Please check the link and passcode.', kind: 'error' });
    } finally {
      setIsEnrollSubmitting(false);
    }
  };

  const handleReturnToEnroll = () => {
    setSelectedTaskId(null);
    setIsSidebarMinimized(false);
  };

  type SubmissionDraft = NonNullable<StudentTask['submission']>;

  const handleSaveSubmission = async (
    taskId: string,
    payload: { files: SubmissionDraft['files']; links: SubmissionDraft['links']; notes: string },
  ) => {
    await saveDraft(taskId, payload);
    setShowSavedModal(true);
  };

  const handleSubmitSubmission = async (
    taskId: string,
    payload: { files: SubmissionDraft['files']; links: SubmissionDraft['links']; notes: string; clarityScore?: number | null },
  ) => {
    await saveDraft(taskId, payload);
    await submitTask(taskId, payload.clarityScore);
    // Submission is handled - the clarity score modal in SubmissionForm will handle the rest
  };

  const showSummary = selectedTask && ['graded', 'closed'].includes(selectedTask.status);

  // Map student tasks to educator sidebar task shape so they render in the shared Sidebar
  const sidebarTasks: SidebarTask[] = tasks.map((t, index) => {
    const dueTimestamp = t.dueDate ? new Date(t.dueDate).getTime() : null;
    const daysUntil = typeof dueTimestamp === 'number' && !Number.isNaN(dueTimestamp)
      ? Math.floor((dueTimestamp - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      id: index,
      title: t.title,
      dueDate: daysUntil,
      submissions: 0,
      timeLeft: '',
      clarityScore: t.summary?.clarityScore ?? undefined,
      isDraft: false,
    };
  });

  // Load current user profile for sidebar (must be before any early returns)
  useEffect(() => {
    (async () => {
      try {
        const me = await getProfile();
        if (!me?.ok) return;
        const u = me.user || {};
        const name = getDisplayName(u);
        // Get role from backend response (primary_role or first role in roles array)
        const userRole = u.primary_role || (u.roles && Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : null);
        setUserProfile({ name, avatar: u.picture, role: userRole || null });
      } catch {}
    })();
  }, []);

  if (loading && tasks.length === 0) {
    return <div className="flex h-screen items-center justify-center">Loading tasks…</div>;
  }

  const refreshProfile = async () => {
    try {
      const me = await getProfile();
      if (!me?.ok) return;
      const u = me.user || {};
      const name = getDisplayName(u);
      // Get role from backend response (primary_role or first role in roles array)
      const userRole = u.primary_role || (u.roles && Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : null);
      setUserProfile({ name, avatar: u.picture, role: userRole || null });
    } catch {}
  };

  return (
    <>
      {toast && (
        <SimpleToast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />
      )}
      <MainLayout
        mainDashboard={
          <>
            {selectedTask ? (
              showSummary ? (
                <StudentTaskSummary
                  task={selectedTask}
                  onBackToWorkspace={() => setSelectedTaskId(selectedTask.id)}
                  onBackToEnroll={handleReturnToEnroll}
                  onRefreshTask={refresh}
                />
              ) : (
                <StudentTaskWorkspace
                  task={selectedTask}
                  onSaveSubmission={handleSaveSubmission}
                  onSubmitSubmission={handleSubmitSubmission}
                  onBackToEnroll={handleReturnToEnroll}
                  onNavigateToEnrollment={handleReturnToEnroll}
                />
              )
            ) : (
              <EnrollTaskView onEnroll={handleEnroll} isSubmitting={isEnrollSubmitting} />
            )}
          </>
        }
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized(prev => !prev)}
        tasks={sidebarTasks}
        onTaskClick={(item) => {
          const idx = typeof (item as any).id === 'number' ? (item as any).id : parseInt(String((item as any).id), 10);
          const target = Number.isFinite(idx) ? tasks[idx] : undefined;
          if (target) setSelectedTaskId(target.id);
        }}
        searchQuery=""
        simpleTasks={false}
        disableExpand
        userProfile={userProfile}
        onLogout={onLogout}
        onProfileUpdated={refreshProfile}
        audience="student"
        isTasksLoading={loading && sidebarTasks.length === 0}
      />
      <SubmissionSavedModal isOpen={showSavedModal} onClose={() => setShowSavedModal(false)} />
    </>
  );
}
