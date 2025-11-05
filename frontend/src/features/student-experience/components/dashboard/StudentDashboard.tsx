'use client';

import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/shared/components/layout';
import EnrollTaskView from '../enroll/EnrollTaskView';
import StudentTaskWorkspace from '../workspace/StudentTaskWorkspace';
import StudentTaskSummary from '../summary/StudentTaskSummary';
import SubmissionSavedModal from '../modals/SubmissionSavedModal';
import SubmissionSubmittedModal from '../modals/SubmissionSubmittedModal';
import { useStudentTasks } from '../../hooks/useStudentTasks';
import type { StudentTask } from '../../types/studentTask';
import type { Task as SidebarTask } from '@/features/educator-experience/types';
import { getMe } from '@/services/authApi';

interface StudentDashboardProps {
  onLogout?: () => void;
}

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const { tasks, loading, enroll, saveDraft, submitTask } = useStudentTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string; role?: string }>();

  const selectedTask: StudentTask | undefined = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId ?? undefined),
    [tasks, selectedTaskId],
  );

  const handleEnroll = async (payload: { link: string; passcode: string }) => {
    const newTask = await enroll(payload);
    if (newTask) {
      setSelectedTaskId(newTask.id);
    }
  };

  const handleSaveSubmission = async (
    taskId: string,
    payload: { files: StudentTask['submission']['files']; links: StudentTask['submission']['links']; notes: string },
  ) => {
    await saveDraft(taskId, payload);
    setShowSavedModal(true);
  };

  const handleSubmitSubmission = async (
    taskId: string,
    payload: { files: StudentTask['submission']['files']; links: StudentTask['submission']['links']; notes: string },
  ) => {
    await saveDraft(taskId, payload);
    await submitTask(taskId);
    setShowSubmittedModal(true);
  };

  const showSummary = selectedTask && ['graded', 'closed'].includes(selectedTask.status);

  // Map student tasks to educator sidebar task shape so they render in the shared Sidebar
  const sidebarTasks: SidebarTask[] = tasks.map((t, index) => {
    const dueMs = new Date(t.dueDate).getTime() - Date.now();
    const daysUntil = Math.floor(dueMs / (1000 * 60 * 60 * 24));
    return {
      id: index,
      title: t.title,
      dueDate: daysUntil,
      submissions: 0,
      timeLeft: '',
      clarityScore: t.summary?.clarityScore ?? 0,
      isDraft: false,
    };
  });

  // Load current user profile for sidebar (must be before any early returns)
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        if (!me?.ok) return;
        const u = me.user || {};
        const first = u.first_name?.toString().trim();
        const last = u.last_name?.toString().trim();
        const name = [first, last].filter(Boolean).join(' ') || u.email || 'User';
        const primary = (u.primary_role || (Array.isArray(u.roles) ? u.roles[0] : '')) as string;
        const role = primary ? primary.charAt(0).toUpperCase() + primary.slice(1) : 'Student';
        setUserProfile({ name, avatar: u.picture, role });
      } catch {}
    })();
  }, []);

  if (loading && tasks.length === 0) {
    return <div className="flex h-screen items-center justify-center">Loading tasks…</div>;
  }

  const refreshProfile = async () => {
    try {
      const me = await getMe();
      if (!me?.ok) return;
      const u = me.user || {};
      const first = u.first_name?.toString().trim();
      const last = u.last_name?.toString().trim();
      const name = [first, last].filter(Boolean).join(' ') || u.email || 'User';
      const primary = (u.primary_role || (Array.isArray(u.roles) ? u.roles[0] : '')) as string;
      const role = primary ? primary.charAt(0).toUpperCase() + primary.slice(1) : 'Student';
      setUserProfile({ name, avatar: u.picture, role });
    } catch {}
  };

  return (
    <>
      <MainLayout
        mainDashboard={
          <>
            {selectedTask ? (
              showSummary ? (
                <StudentTaskSummary
                  task={selectedTask}
                  onBackToWorkspace={() => setSelectedTaskId(selectedTask.id)}
                />
              ) : (
                <StudentTaskWorkspace
                  task={selectedTask}
                  onSaveSubmission={handleSaveSubmission}
                  onSubmitSubmission={handleSubmitSubmission}
                />
              )
            ) : (
              <EnrollTaskView onEnroll={handleEnroll} />
            )}
          </>
        }
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized(prev => !prev)}
        tasks={sidebarTasks}
        onTaskClick={(task) => {
          const target = tasks[task.id];
          if (target) setSelectedTaskId(target.id);
        }}
        searchQuery=""
        simpleTasks={false}
        disableExpand
        userProfile={userProfile}
        onLogout={onLogout}
        onProfileUpdated={refreshProfile}
      />
      
      <SubmissionSavedModal isOpen={showSavedModal} onClose={() => setShowSavedModal(false)} />
      <SubmissionSubmittedModal
        isOpen={showSubmittedModal}
        onClose={() => setShowSubmittedModal(false)}
        onViewSummary={() => {
          setShowSubmittedModal(false);
        }}
      />
    </>
  );
}
