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

  // CHANGED: Initial tasks (using mockTasks; drafts can be added later)
  const tasks: Task[] = mockTasks;
  const allTasks = useMemo(() => [...tasks], [tasks]);

  // CHANGED: Clicking a task -> enter OngoingTasks (can extend for ClosedTaskReview later)
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowingLayout3(true);
  };
  const handlePromptSubmit = () => {
    // TODO: wire AI generation flow
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
    return () => { alive = false; };
  }, []);

  // CHANGED: Main panel (landing vs OngoingTasks after a task is selected)
  const mainDashboard = (
    showingLayout3 && selectedTask ? (
      <OngoingTasks
        taskTitle={selectedTask.title}
        submissions={submissions}
        taskFormData={taskFormData}
        onTaskFormChange={setTaskFormData}
        onPublishTask={() => {}}
        onModifyTask={() => {}}
        onPreview={() => {}}
        onSaveDraft={() => {}}
        onTaskSchedule={() => {}}
        onSubmissionClick={() => {}}
        educatorSubmissions={educatorSubmissions}
        approvedGrades={approvedGrades}
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
    <MainLayout
      mainDashboard={mainDashboard}
      isMinimized={isSidebarMinimized}
      onToggleMinimize={() => setIsSidebarMinimized((prev) => !prev)}
      tasks={allTasks}
      onTaskClick={handleTaskClick}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      
      userProfile={{ name: 'Dr. Sarah Johnson', role: 'Educator' }}
      onLogout={handleLogout} // CHANGED: pass logout to Sidebar
    />
  );
}
