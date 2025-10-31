import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import './App.css';
import { Auth0Mock } from './features/auth';
import { DashboardSelection } from './features/dashboard-selection';
import { MainLayout, Layout1, Layout2, Header, SplashLayout } from './shared/components/layout';
import { AInputBox } from './shared/components/forms';
import { HensLoader } from './shared/components/ui';
import {
  ClosedTaskReview,
  OngoingTasks,
  TaskCreationForm,
  PreviewModal,
  DraftSavedModal,
  TaskScheduleModal,
  TaskPublishedModal,
  TaskReadyToPublishModal,
  SubmissionDetailsModal,
  BottomInputBar
} from './features/educator-experience/components';
import StudentDashboard from './features/student-experience/components/StudentDashboard';
import type {
  Task,
  TaskFormData,
  StudentSubmission,
  EducatorSubmissionsMap,
  ApprovedGradesMap
} from './features/educator-experience/types';
import { fetchDashboardBootstrap, generateTaskWithAI } from './services/api/educatorDashboard';
import { defaultTaskFormData } from './mocks/data/tasks';

const MIN_LOADER_DURATION_MS = 2200;

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Dashboard selection state
  const [showDashboardSelection, setShowDashboardSelection] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<'educator' | 'student' | null>(null);

  // Layout state
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showingLayout3, setShowingLayout3] = useState(false);
  const [currentSelectedTask, setCurrentSelectedTask] = useState<Task | null>(null);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);

  // Data state
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draftTasks, setDraftTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(defaultTaskFormData);
  const [educatorSubmissions, setEducatorSubmissions] = useState<EducatorSubmissionsMap>({});
  const [approvedGrades, setApprovedGrades] = useState<ApprovedGradesMap>({});

  // Submission selection
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  // Task schedule state
  const [taskSchedule, setTaskSchedule] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    startTime?: string;
    endTime?: string;
  }>({
    startDate: null,
    endDate: null
  });

  // UI state
  const [taskInput, setTaskInput] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDraftSavedModal, setShowDraftSavedModal] = useState(false);
  const [showTaskScheduleModal, setShowTaskScheduleModal] = useState(false);
  const [showTaskPublishedModal, setShowTaskPublishedModal] = useState(false);
  const [showTaskReadyToPublishModal, setShowTaskReadyToPublishModal] = useState(false);
  const [showSubmissionDetailsModal, setShowSubmissionDetailsModal] = useState(false);
  const [showGradeSuccessToast, setShowGradeSuccessToast] = useState(false);
  const [lastApprovedGrade, setLastApprovedGrade] = useState<'pass' | 'fail' | null>(null);
  const [lastApprovedStudent, setLastApprovedStudent] = useState<string | null>(null);
  const [showSplashLoader, setShowSplashLoader] = useState(true);

  const loaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleInitializationComplete = useCallback((startedAt: number) => {
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MIN_LOADER_DURATION_MS - elapsed);
    if (loaderTimeoutRef.current) {
      clearTimeout(loaderTimeoutRef.current);
    }
    loaderTimeoutRef.current = setTimeout(() => {
      setIsInitializing(false);
      loaderTimeoutRef.current = null;
    }, remaining);
  }, [setIsInitializing]);

  const scheduleGenerationComplete = useCallback((startedAt: number) => {
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MIN_LOADER_DURATION_MS - elapsed);
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
    }
    generationTimeoutRef.current = setTimeout(() => {
      setIsGeneratingTask(false);
      generationTimeoutRef.current = null;
    }, remaining);
  }, [setIsGeneratingTask]);

  const loadDashboardData = useCallback(async () => {
    const startedAt = performance.now();
    setIsInitializing(true);
    setLoadError(null);
    try {
      const bootstrap = await fetchDashboardBootstrap();
      setTasks(bootstrap.tasks);
      setSubmissions(bootstrap.submissions);
      setTaskFormData(bootstrap.defaultTaskForm);
      setEducatorSubmissions(bootstrap.educatorSubmissions);
      setApprovedGrades(bootstrap.approvedGrades);
    } catch (error) {
      console.error('Failed to load educator dashboard', error);
      setLoadError('We were unable to load the educator dashboard. Please try again.');
    } finally {
      scheduleInitializationComplete(startedAt);
    }
  }, [scheduleInitializationComplete]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const allTasks = useMemo(() => [...tasks, ...draftTasks], [tasks, draftTasks]);
  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [submissions, selectedSubmissionId]
  );

  const handleLogin = () => {
    setUser({ name: 'Dr. Sarah Johnson', email: 'sarah@eduhens.com' });
    setIsAuthenticated(true);
    setShowDashboardSelection(true);
  };

  const handleDashboardSelect = (type: 'educator' | 'student') => {
    setSelectedDashboard(type);
    setShowDashboardSelection(false);
  };

  const handleLogout = useCallback(() => {
    if (loaderTimeoutRef.current) {
      clearTimeout(loaderTimeoutRef.current);
      loaderTimeoutRef.current = null;
    }
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
      generationTimeoutRef.current = null;
    }
    if (splashTimeoutRef.current) {
      clearTimeout(splashTimeoutRef.current);
      splashTimeoutRef.current = null;
    }

    setIsAuthenticated(false);
    setUser(null);
    setShowDashboardSelection(false);
    setSelectedDashboard(null);
    setIsSidebarMinimized(false);
    setIsCreatingTask(false);
    setShowingLayout3(false);
    setCurrentSelectedTask(null);
    setSelectedSubmissionId(null);
    setSearchQuery('');
    setTaskInput('');
    setShowPreviewModal(false);
    setShowDraftSavedModal(false);
    setShowTaskScheduleModal(false);
    setShowTaskPublishedModal(false);
    setShowTaskReadyToPublishModal(false);
    setShowSubmissionDetailsModal(false);
    setShowGradeSuccessToast(false);
    setLastApprovedGrade(null);
    setLastApprovedStudent(null);
    setShowSplashLoader(false);
  }, []);

  const handleTaskClick = (task: Task) => {
    setCurrentSelectedTask(task);
    setSelectedSubmissionId(null);

    if (task.isDraft) {
      setIsCreatingTask(true);
      setShowingLayout3(false);
      setTaskFormData(task.formData ?? taskFormData);
      return;
    }

    setIsCreatingTask(false);
    setShowingLayout3(true);
  };

  const handlePublishTask = (data: TaskFormData) => {
    console.log('Publishing task:', data);
    setShowTaskReadyToPublishModal(true);
  };

  const handleModifyTask = (message: string) => {
    console.log('Modifying task with message:', message);
  };

  const handleSaveDraft = () => {
    if (!taskFormData) return;

    const existingDraftIndex = draftTasks.findIndex((task) => task.isDraft);
    const existingDraftId = existingDraftIndex >= 0 ? draftTasks[existingDraftIndex].id : Date.now();

    const updatedDraftTask: Task = {
      id: existingDraftId,
      title: taskFormData.title || 'Untitled Task',
      dueDate: 7,
      submissions: 0,
      timeLeft: '7 days',
      clarityScore: 0,
      isDraft: true,
      formData: taskFormData
    };

    if (existingDraftIndex >= 0) {
      setDraftTasks((prev) => prev.map((task, index) => (index === existingDraftIndex ? updatedDraftTask : task)));
    } else {
      setDraftTasks((prev) => [...prev, updatedDraftTask]);
    }

    setShowDraftSavedModal(true);
  };

  const handleTaskSchedule = () => {
    setShowTaskScheduleModal(true);
  };

  const handleScheduleSave = (startDate: Date | null, endDate: Date | null, startTime?: string, endTime?: string) => {
    setTaskSchedule({ startDate, endDate, startTime, endTime });
  };

  const handlePromptSubmit = async () => {
    const prompt = taskInput.trim();
    if (!prompt) {
      return;
    }

    setIsCreatingTask(true);
    setShowingLayout3(false);
    setTaskInput('');
    setIsGeneratingTask(true);
    const startedAt = performance.now();

    try {
      const generatedTask = await generateTaskWithAI(prompt);
      setTaskFormData(generatedTask);
    } catch (error) {
      console.error('Failed to generate AI task', error);
    } finally {
      scheduleGenerationComplete(startedAt);
    }
  };

  const generateMockSchedule = (dueDate: number) => {
    if (dueDate < 0) {
      return { startDate: null, endDate: null };
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + dueDate * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  };

  const persistEducatorSubmission = (grade: 'pass' | 'fail', feedback: string) => {
    if (selectedSubmissionId == null) {
      return;
    }

    setEducatorSubmissions((prev) => ({
      ...prev,
      [selectedSubmissionId]: {
        grade,
        feedback,
        submittedAt: new Date()
      }
    }));
  };

  const persistApprovedGrade = () => {
    if (selectedSubmissionId == null) {
      return;
    }

    setApprovedGrades((prev) => ({
      ...prev,
      [selectedSubmissionId]: true
    }));
  };

  useEffect(() => {
    splashTimeoutRef.current = setTimeout(() => {
      setShowSplashLoader(false);
      splashTimeoutRef.current = null;
    }, MIN_LOADER_DURATION_MS);

    return () => {
      if (splashTimeoutRef.current) {
        clearTimeout(splashTimeoutRef.current);
      }
      if (loaderTimeoutRef.current) {
        clearTimeout(loaderTimeoutRef.current);
      }
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showGradeSuccessToast) {
      return;
    }
    const timeout = setTimeout(() => {
      setShowGradeSuccessToast(false);
    }, 2600);
    return () => clearTimeout(timeout);
  }, [showGradeSuccessToast]);

  const gradeToast = showGradeSuccessToast ? (
    <div className="fixed top-8 left-1/2 z-[9999] w-full max-w-2xl -translate-x-1/2 transform px-6">
      <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-2xl shadow-green-100/80">
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-lg font-semibold text-slate-900">Grade approved</p>
            <p className="text-sm text-slate-500">
              {lastApprovedGrade
                ? `Stored ${lastApprovedGrade === 'pass' ? 'Pass' : 'Fail'} decision${lastApprovedStudent ? ` for ${lastApprovedStudent}` : ''}`
                : 'Submission status updated successfully'}
            </p>
          </div>
          <button
            onClick={() => setShowGradeSuccessToast(false)}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close notification"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500" />
      </div>
    </div>
  ) : null;

  if (!isAuthenticated) {
    if (showSplashLoader) {
      return (
        <SplashLayout>
          <HensLoader />
        </SplashLayout>
      );
    }
    return (
      <>
        <Auth0Mock onLogin={handleLogin} />
        {gradeToast}
      </>
    );
  }

  if (showDashboardSelection) {
    return <DashboardSelection onSelect={handleDashboardSelect} />;
  }

  if (selectedDashboard === 'educator') {
    const renderEducatorDashboard = () => {
      if (isInitializing) {
        return (
          <Layout1>
            <div className="flex h-full w-full items-center justify-center p-6">
              <HensLoader />
            </div>
          </Layout1>
        );
      }

      if (loadError) {
        return (
          <Layout1>
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-700 text-center max-w-sm">{loadError}</p>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                Try again
              </button>
            </div>
          </Layout1>
        );
      }

      if (showingLayout3 && currentSelectedTask) {
        const isClosedTask = currentSelectedTask.dueDate < 0;
        if (isClosedTask) {
          return (
            <ClosedTaskReview
              task={currentSelectedTask}
              submissions={submissions}
              educatorSubmissions={educatorSubmissions}
              approvedGrades={approvedGrades}
              onSubmissionClick={(submission) => setSelectedSubmissionId(submission.id)}
              onEducatorSubmission={(grade, feedback) =>
                persistEducatorSubmission(grade as 'pass' | 'fail', feedback)
              }
              onApproveGrade={(grade) => {
                persistApprovedGrade();
                setLastApprovedGrade(grade);
                setLastApprovedStudent(selectedSubmission?.studentName ?? null);
                setShowGradeSuccessToast(true);
              }}
            />
          );
        }

        const schedule = generateMockSchedule(currentSelectedTask.dueDate);

        return (
          <OngoingTasks
            taskTitle={currentSelectedTask.title}
            submissions={submissions}
            taskFormData={taskFormData}
            onTaskFormChange={setTaskFormData}
            onPublishTask={handlePublishTask}
            onModifyTask={handleModifyTask}
            scheduledStart={schedule.startDate}
            scheduledEnd={schedule.endDate}
            onPreview={() => setShowPreviewModal(true)}
            onSaveDraft={handleSaveDraft}
            onTaskSchedule={handleTaskSchedule}
            onSubmissionClick={(submission) => {
              setSelectedSubmissionId(submission.id);
              setShowSubmissionDetailsModal(true);
            }}
            educatorSubmissions={educatorSubmissions}
            approvedGrades={approvedGrades}
          />
        );
      }

      if (isCreatingTask) {
        const schedule = generateMockSchedule(currentSelectedTask?.dueDate ?? 7);

        return (
          <Layout2
            header={
              <Header
                title="Task Lab"
                subtitle="Create New Task"
                taskTitle={taskFormData.title}
                scheduledStart={taskSchedule.startDate ?? schedule.startDate}
                scheduledEnd={taskSchedule.endDate ?? schedule.endDate}
                actions={
                  <>
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="bg-white border border-[#cccccc] flex gap-2 items-center justify-center px-4 py-3 rounded hover:bg-gray-50 hover:border-[#999999] transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="#595959" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm text-[#595959]">Preview</span>
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      className="bg-white border border-[#cccccc] flex gap-2 items-center justify-center px-4 py-3 rounded hover:bg-gray-50 hover:border-[#999999] transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="#595959" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16M4 8h16M4 16h16M4 20h16" />
                      </svg>
                      <span className="text-sm text-[#595959]">Save Draft</span>
                    </button>
                    <button
                      onClick={handleTaskSchedule}
                      className="bg-white border border-[#cccccc] flex gap-2 items-center justify-center px-4 py-3 rounded hover:bg-gray-50 hover:border-[#999999] transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="#595959" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-[#595959]">Task Schedule</span>
                    </button>
                  </>
                }
              />
            }
            bottomBar={
              <BottomInputBar
                onPublish={() => handlePublishTask(taskFormData)}
                onModify={handleModifyTask}
                placeholder="Hens can modify it for you"
                publishLabel="Publish Task"
              />
            }
          >
            {isGeneratingTask ? (
              <div className="flex h-full w-full items-center justify-center p-6">
                <div className="hens-spinner hens-spinner--lg" />
              </div>
            ) : (
              <TaskCreationForm
                data={taskFormData}
                onChange={setTaskFormData}
              />
            )}
          </Layout2>
        );
      }

      return (
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
      );
    };

    return (
      <>
        <MainLayout
          mainDashboard={renderEducatorDashboard()}
          isMinimized={isSidebarMinimized}
          onToggleMinimize={() => setIsSidebarMinimized((prev) => !prev)}
          tasks={allTasks}
          onTaskClick={handleTaskClick}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userProfile={user ?? undefined}
          onLogout={handleLogout}
        />

        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          taskData={taskFormData}
          onPublish={() => handlePublishTask(taskFormData)}
        />
        <DraftSavedModal
          isOpen={showDraftSavedModal}
          onClose={() => setShowDraftSavedModal(false)}
        />
        <TaskScheduleModal
          isOpen={showTaskScheduleModal}
          onClose={() => setShowTaskScheduleModal(false)}
          onSave={handleScheduleSave}
          initialStartDate={taskSchedule.startDate}
          initialEndDate={taskSchedule.endDate}
        />
        <TaskPublishedModal
          isOpen={showTaskPublishedModal}
          onClose={() => setShowTaskPublishedModal(false)}
        />
        <TaskReadyToPublishModal
          isOpen={showTaskReadyToPublishModal}
          onClose={() => setShowTaskReadyToPublishModal(false)}
          onPublish={() => {
            setShowTaskReadyToPublishModal(false);
            setShowTaskPublishedModal(true);
          }}
        />
        <SubmissionDetailsModal
          isOpen={showSubmissionDetailsModal}
          onClose={() => setShowSubmissionDetailsModal(false)}
          onApproveGrade={(grade) => {
            persistApprovedGrade();
            setShowSubmissionDetailsModal(false);
            setLastApprovedGrade(grade);
            setLastApprovedStudent(selectedSubmission?.studentName ?? null);
            setShowGradeSuccessToast(true);
          }}
          onEducatorSubmission={(grade, feedback) =>
            persistEducatorSubmission(grade as 'pass' | 'fail', feedback)
          }
          educatorSubmission={selectedSubmissionId ? educatorSubmissions[selectedSubmissionId] : undefined}
          isGradeApproved={selectedSubmissionId ? Boolean(approvedGrades[selectedSubmissionId]) : false}
          selectedSubmission={selectedSubmission}
        />
        {gradeToast}
      </>
    );
  }

  if (selectedDashboard === 'student') {
    return <StudentDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Student dashboard is coming soon.</p>
      {gradeToast}
    </div>
  );
}

export default App;
