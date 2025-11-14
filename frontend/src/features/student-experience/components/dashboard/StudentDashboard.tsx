'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/shared/components/layout';
import EnrollTaskView from '../enroll/EnrollTaskView';
import StudentTaskWorkspace from '../workspace/StudentTaskWorkspace';
import StudentTaskSummary from '../summary/StudentTaskSummary';
import SubmissionSavedModal from '../Modals/SubmissionSavedModal';
import SubmissionSubmittedModal from '../Modals/SubmissionSubmittedModal';
import StudentSubmissionSummaryModal from '../Modals/StudentSubmissionSummaryModal';
import { getLatestSubmission } from '../../services/studentTaskService';
import { useStudentTasks } from '../../hooks/useStudentTasks';
import type { StudentTask } from '../../types/studentTask';
import type { Task as SidebarTask } from '@/features/educator-experience/types';
import { ensureRole, getMe } from '@/services/authApi';
import SimpleToast from '@/shared/components/ui/SimpleToast';

interface StudentDashboardProps {
  onLogout?: () => void;
}

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const { tasks, loading, enroll, saveDraft, submitTask } = useStudentTasks();
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [aiModalStatus, setAiModalStatus] = useState<'pending' | 'pass' | 'fail' | null>(null);
  const [aiModalFeedback, setAiModalFeedback] = useState<string | null>(null);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string; role?: string }>();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind?: 'info' | 'success' | 'error'; position?: 'top-right' | 'center' } | null>(null);

  const selectedTask: StudentTask | undefined = useMemo(
    () => tasks.find((task) => task.id === (selectedTaskId ?? '')),
    [tasks, selectedTaskId],
  );

  const handleEnroll = async (payload: { link: string; passcode: string }) => {
    const newTask = await enroll(payload);
    if (newTask) {
      setSelectedTaskId(newTask.id);
    }
  };

  const handleReturnToEnroll = () => {
    setSelectedTaskId(null);
    setIsSidebarMinimized(false);
  };

  const handleSwitchToEducator = async () => {
    try {
      setIsSwitchingRole(true);
      const res = await ensureRole('teacher');
      if (res?.ok === false) throw new Error(res?.error || 'role error');
      router.push('/educator-experience');
    } catch (error) {
      console.error('Failed to switch to educator role', error);
      setToast({ message: 'Could not open educator experience right now.', kind: 'error' });
    } finally {
      setIsSwitchingRole(false);
    }
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
    payload: { files: SubmissionDraft['files']; links: SubmissionDraft['links']; notes: string },
  ) => {
    await saveDraft(taskId, payload);
    await submitTask(taskId);
    setAiModalStatus('pending');
    setAiModalFeedback(null);
    setShowSubmittedModal(true);
    // Best-effort: poll a few times for AI feedback
    try {
      for (let i = 0; i < 12; i++) { // up to ~24s
        await new Promise(r => setTimeout(r, 2000));
        const latest = await getLatestSubmission(taskId);
        const aiScore = latest?.ai_score;
        const aiFeedback = latest?.ai_feedback || null;
        if (aiScore != null || aiFeedback) {
          let status: 'pass' | 'fail' | 'pending' = 'pending';
          if (typeof aiScore === 'number') status = aiScore >= 60 ? 'pass' : 'fail';
          else if (aiScore === 1) status = 'pass';
          else if (aiScore === 0) status = 'fail';
          else if (typeof aiFeedback === 'string') {
            try {
              let cleaned = aiFeedback.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
              const parsed = JSON.parse(cleaned);
              const overall = (parsed?.overall || '').toString().toLowerCase();
              if (overall === 'pass' || overall === 'fail') status = overall as any;
            } catch {}
          }
          setAiModalStatus(status as any);
          setAiModalFeedback(typeof aiFeedback === 'string' ? aiFeedback : (aiFeedback ? JSON.stringify(aiFeedback) : null));
          break;
        }
      }
    } catch {}
  };

  const openSummary = async () => {
    try {
      const tid = selectedTaskId;
      if (tid) {
        const latest = await getLatestSubmission(tid);
        const aiScore = latest?.ai_score;
        const aiFeedback = latest?.ai_feedback || null;
        let status: 'pass' | 'fail' | 'pending' | null = null;
        if (typeof aiScore === 'number') status = aiScore >= 60 ? 'pass' : 'fail';
        else if (aiScore === 1) status = 'pass';
        else if (aiScore === 0) status = 'fail';
        else if (typeof aiFeedback === 'string') {
          try {
            let cleaned = aiFeedback.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
            const parsed = JSON.parse(cleaned);
            const overall = (parsed?.overall || '').toString().toLowerCase();
            if (overall === 'pass' || overall === 'fail') status = overall as any; else status = 'pending';
          } catch { status = 'pending'; }
        } else {
          status = 'pending';
        }
        setAiModalStatus(status);
        setAiModalFeedback(typeof aiFeedback === 'string' ? aiFeedback : (aiFeedback ? JSON.stringify(aiFeedback) : null));
      }
    } catch {}
    setShowSummaryModal(true);
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
                />
              ) : (
                <StudentTaskWorkspace
                  task={selectedTask}
                  onSaveSubmission={handleSaveSubmission}
                  onSubmitSubmission={handleSubmitSubmission}
                  onShowSummary={openSummary}
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
      />
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 text-sm">
        <button
          type="button"
          onClick={handleReturnToEnroll}
          className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-slate-700 shadow hover:bg-white transition"
        >
          Back to Enrollment Hub
        </button>
        <button
          type="button"
          onClick={handleSwitchToEducator}
          disabled={isSwitchingRole}
          className="rounded-full bg-[#484de6] px-4 py-2 text-white shadow hover:bg-[#3b42d9] disabled:opacity-60 disabled:cursor-not-allowed transition flex flex-col items-end"
        >
          <span>{isSwitchingRole ? 'Opening Educator Experience…' : 'Open Educator Experience'}</span>
          <span className="text-[11px] text-indigo-100">for test purposes</span>
        </button>
      </div>
      
      <SubmissionSavedModal isOpen={showSavedModal} onClose={() => setShowSavedModal(false)} />
      <SubmissionSubmittedModal
        isOpen={showSubmittedModal}
        onClose={() => setShowSubmittedModal(false)}
        onViewSummary={() => {
          setShowSubmittedModal(false);
          openSummary();
        }}
        aiStatus={aiModalStatus}
        aiFeedback={aiModalFeedback || undefined as any}
      />
      <StudentSubmissionSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        status={aiModalStatus}
        feedback={aiModalFeedback || null}
      />
    </>
  );
}
