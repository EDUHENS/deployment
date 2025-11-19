'use client';

import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { updateMe } from '@/services/authApi';
import TaskItem from './TaskItem';
import { Search, Minimize2, Maximize2, LogOut, FileText, CheckCircle2, AlertCircle, Loader2, Settings } from 'lucide-react';
import { CloseButton } from '@/shared/components/ui';
import type { Task } from '../../educator-experience/types';
import { useRealtimeDate, calculateDaysUntilDue } from '../../shared/hooks/useRealtimeDate';

export interface SidebarProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onLogoClick?: () => void;
  userProfile?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  /** Explicit audience to adjust empty-state copy */
  audience?: 'student' | 'educator';
  /** When true, render tasks as simple rows (status dot + title) without expanders */
  simpleTasks?: boolean;
  /** When true, render TaskItem but keep it collapsed (no expansion), clicking row triggers onTaskClick */
  disableExpand?: boolean;
  onLogout?: () => void;
  onProfileUpdated?: () => void;
  isTasksLoading?: boolean;
}

export default function Sidebar({
  isMinimized = false,
  onToggleMinimize,
  tasks = [],
  onTaskClick,
  searchQuery = '',
  onSearchChange,
  onLogoClick,
  userProfile,
  audience,
  simpleTasks = false,
  disableExpand = false,
  onLogout,
  onProfileUpdated,
  isTasksLoading = false,
}: SidebarProps) {
  // TODO(db): When a task is selected, fetch its latest form/submission state from API.
  // - Use task.id to request GET /tasks/:id and GET /tasks/:id/form
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Array<string | number>>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState(userProfile?.name ?? '');
  const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null);
  // Use role from userProfile (from backend) instead of hardcoding based on audience
  // Fallback to audience-based label only if no role from backend
  const displayName = pendingDisplayName ?? userProfile?.name ?? userName;
  const displayRole = userProfile?.role || (audience === 'student' ? 'student' : audience === 'educator' ? 'teacher' : null);
  // Capitalize for display
  const roleLabel = displayRole ? displayRole.charAt(0).toUpperCase() + displayRole.slice(1) : '';
  // Keep audienceRole for backward compatibility in UI checks (lowercase for comparison)
  const audienceRole = audience === 'student' ? 'student' : audience === 'educator' ? 'teacher' : null;
  const isProfileNameLoaded = Boolean(userProfile?.name);
  const isProfileRoleLoaded = Boolean(displayRole);
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatar ?? '');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const saveBannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local editable name in sync with incoming profile, reset optimistic state
  useEffect(() => {
    if (userProfile?.name && userProfile.name !== userName) {
      setUserName(userProfile.name);
    }
    setPendingDisplayName(null);
  }, [userProfile?.name]);

  useEffect(() => {
    setAvatarPreview(userProfile?.avatar ?? '');
  }, [userProfile?.avatar]);

  useEffect(() => {
    return () => {
      if (saveBannerTimeout.current) {
        clearTimeout(saveBannerTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showUserModal) {
      if (saveBannerTimeout.current) {
        clearTimeout(saveBannerTimeout.current);
      }
      setSaveState('idle');
      setSaveMessage(null);
    }
  }, [showUserModal]);

  const scheduleSaveBannerReset = () => {
    if (saveBannerTimeout.current) {
      clearTimeout(saveBannerTimeout.current);
    }
    saveBannerTimeout.current = setTimeout(() => {
      setSaveState('idle');
      setSaveMessage(null);
    }, 4000);
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(localSearchQuery.toLowerCase())
  );
  const showTaskSkeletons = isTasksLoading && tasks.length === 0;
  const sidebarCurrentDate = useRealtimeDate();

  const getTaskDaysRemaining = (taskDue: Task['dueDate']) => {
    if (typeof taskDue === 'number') {
      return taskDue;
    }
    return calculateDaysUntilDue(taskDue as any, sidebarCurrentDate);
  };

  // CHANGED: Accordion behavior — keep only one expanded at a time
  const handleTaskToggle = (taskId: string | number) => {
    setExpandedTaskIds((prev) => (prev.includes(taskId) ? [] : [taskId]));
  };

  const handleManageReview = (task: Task) => {
    if (task.isDraft) {
      // For draft tasks, go to task creation page
      console.log('Manage & Publish clicked for draft task:', task);
      // This will be handled by the parent component
      onTaskClick?.(task);
    } else {
      // For regular tasks, go to Layout 3
      console.log('Manage & Review clicked for regular task:', task);
      // This will be handled by the parent component
      onTaskClick?.(task);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleAvatarFileChange = async (file: File) => {
    if (!file) return;
    const MAX_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setAvatarError('Please choose an image smaller than 3 MB.');
      return;
    }
    setAvatarError(null);
    try {
      setIsUploadingAvatar(true);
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarPreview(dataUrl);
      const result = await updateMe({ picture: dataUrl });
      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to update profile photo');
      }
      onProfileUpdated?.();
      setSaveState('success');
      setSaveMessage('Profile photo updated successfully.');
      scheduleSaveBannerReset();
    } catch (e) {
      console.error('Failed to upload profile picture', e);
      setAvatarError('Upload failed. Please try again.');
      setSaveState('error');
      setSaveMessage('Could not update profile photo.');
      scheduleSaveBannerReset();
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void handleAvatarFileChange(file);
    event.target.value = '';
  };

  const handleProfileSave = async () => {
    const trimmed = (userName || '').trim();
    if (!trimmed) {
      setSaveState('error');
      setSaveMessage('Please enter your name before saving.');
      scheduleSaveBannerReset();
      return;
    }
    try {
      setSaveState('saving');
      setSaveMessage(null);
      const result = await updateMe({ name: trimmed, fullName: trimmed });
      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to save profile');
      }
      await onProfileUpdated?.();
      setPendingDisplayName(trimmed);
      setSaveState('success');
      setSaveMessage('Profile updated successfully.');
      scheduleSaveBannerReset();
      setUserName(trimmed);
      setShowUserModal(false);
    } catch (e) {
      console.error('Failed to save profile name', e);
      setSaveState('error');
      setSaveMessage('Could not save your changes. Please try again.');
      scheduleSaveBannerReset();
    }
  };

  const isSavingProfile = saveState === 'saving';

  const saveNotification =
    saveState !== 'idle' && saveState !== 'saving' && saveMessage ? (
      <div
        className={`fixed left-1/2 top-8 z-[60] flex w-[90%] max-w-xl -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-3 text-sm shadow-lg ${
          saveState === 'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}
        aria-live="polite"
      >
        {saveState === 'success' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <p>{saveMessage}</p>
      </div>
    ) : null;

  if (isMinimized) {
    return (
      <>
        {saveNotification}
        <div className="bg-[#f8f8f8] flex flex-col items-center justify-between pb-4 pt-6 px-4 h-screen">
        {/* Header */}
        <div className="flex flex-col items-center" style={{ gap: '48px' }}>
          <div className="flex flex-col items-center" style={{ gap: '48px' }}>
            {/* Logo and Minimize button */}
            <div className="flex flex-col items-center" style={{ gap: '32px' }}>
              {/* Logo */}
              <div 
                className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={onLogoClick}
              >
                <Image src="/favicon.svg" alt="EduHens Logo" width={24} height={24} className="w-full h-full" />
              </div>

              {/* Minimize button */}
              <button
                onClick={onToggleMinimize}
                className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded transition-colors duration-200"
              >
                <Maximize2 className="w-5 h-5 text-gray-600 hover:text-gray-800 hover:scale-110 transition-all duration-200" />
              </button>
            </div>

            {/* Search icon */}
            <div className="bg-neutral-100 flex items-center justify-center p-2 h-10 rounded-lg">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Tasks section */}
          <div className="flex flex-col items-center" style={{ gap: '31px', marginTop: '8px' }}>
            <div className="flex gap-2 items-center">
              <p className="text-[16px] text-gray-500">Tasks</p>
            </div>

            <div className="flex flex-col items-start" style={{ gap: '36px' }}>
              {filteredTasks.map((task) => (
                <div key={task.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleManageReview(task)}
                    className="flex items-center justify-center"
                  >
                    <div className="flex gap-2 items-center">
                      {task.isDraft ? (
                        <FileText className="w-6 h-6 text-gray-600 transition-transform duration-200 group-hover:scale-110" />
                      ) : (
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125 ${
                            getTaskDaysRemaining(task.dueDate) < 0
                              ? 'bg-gray-400'
                              : getTaskDaysRemaining(task.dueDate) <= 2
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Hover Popover */}
                  <div className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-gray-300">
                      {getTaskDaysRemaining(task.dueDate) < 0 ? 'Overdue' :
                       getTaskDaysRemaining(task.dueDate) <= 2 ? 'Due Soon' : 'On Track'}
                    </div>
                    {/* Arrow pointing to circle */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="flex flex-col gap-2 items-center justify-end w-full">
          <button
            onClick={() => setShowUserModal(true)}
            className="w-10 h-10 border-2 border-[#484de6] rounded-full bg-[#edebe9] flex items-center justify-center cursor-pointer hover:bg-[#e0e0e0] transition-colors duration-200"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="User avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            )}
          </button>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      {saveNotification}
      <div className="bg-[#f8f8f8] flex flex-col items-start h-screen w-[384px]">
      {/* Main content */}
      <div className="flex flex-col gap-12 grow items-start min-h-0 min-w-0 p-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div 
            className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={onLogoClick}
          >
            <Image src="/favicon.svg" alt="EduHens Logo" width={24} height={24} className="w-full h-full" />
          </div>
          <button
            onClick={onToggleMinimize}
            className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded transition-colors duration-200"
          >
            <Minimize2 className="w-5 h-5 text-gray-600 hover:text-gray-800 hover:scale-110 transition-all duration-200" />
          </button>
        </div>

        {/* Search */}
            <div className="bg-white border border-[#e6e6e6] rounded-lg w-full hover:border-gray-400 transition-all duration-200 focus-within:border-[#484de6] focus-within:ring-4 focus-within:ring-[#c7d7fe]">
          <div className="flex gap-1 items-center p-3 rounded-lg w-full">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search task"
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 text-[#222222] text-base placeholder-[#666666] outline-none"
            />
          </div>
        </div>

        {/* Tasks section */}
        <div className="flex flex-col gap-4 grow items-start min-h-0 min-w-0 overflow-x-clip overflow-y-auto w-full">
          <div className="border-b border-[#e6e6e6] pb-2 w-full">
            <p className="text-[#666666] text-base">Tasks</p>
          </div>

          <div className="flex flex-col gap-3 grow items-start min-h-0 min-w-0 overflow-x-clip overflow-y-auto w-full">
            {showTaskSkeletons ? (
              <div className="flex flex-col gap-3 w-full" aria-label="Loading tasks">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`task-skeleton-${idx}`}
                    className="w-full rounded-[12px] border border-[#e6e6e6] bg-white p-4 animate-pulse flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                    </div>
                    <div className="pl-6 flex flex-col gap-2">
                      <div className="h-3 w-2/3 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <p className="text-gray-400 text-sm px-2">
                {localSearchQuery?.trim()
                  ? `No tasks match "${localSearchQuery.trim()}"`
                  : ((audience || roleLabel?.toLowerCase()) === 'student'
                      ? 'You are not enrolled in any tasks yet.'
                      : 'You have not published any tasks yet.')}
              </p>
            ) : filteredTasks.map((task) => (
              simpleTasks ? (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onTaskClick?.(task)}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2 max-w-[240px] overflow-clip">
                    <div
                      className={`size-2.5 rounded-full ${
                        getTaskDaysRemaining(task.dueDate) < 0 ? 'bg-gray-400' : getTaskDaysRemaining(task.dueDate) <= 2 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                    />
                    <p className="text-gray-900 text-base leading-normal tracking-[0.28px] truncate">
                      {task.title}
                    </p>
                  </div>
                </button>
              ) : (
                <TaskItem
                  key={task.id}
                  id={task.id} // CHANGED: pass id for future DB use
                  title={task.title}
                  dueDate={task.dueDate}
                  dueAt={task.dueAt}
                  updatedAt={task.updatedAt}
                  isExpanded={disableExpand ? false : expandedTaskIds.includes(task.id)}
                  onToggle={disableExpand ? (() => onTaskClick?.(task)) : (() => handleTaskToggle(task.id))}
                  onManageReview={() => (onTaskClick ? onTaskClick(task) : handleManageReview(task))}
                  submissions={task.submissions}
                  timeLeft={task.timeLeft}
                  clarityScore={task.clarityScore}
                  isDraft={task.isDraft}
                  isArchived={task.isArchived}
                  hideChevron={disableExpand}
                />
              )
            ))}
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-[#f8f8f8] border-t border-[#e6e6e6] flex items-center justify-between p-6 w-full">
        <button
          onClick={() => setShowUserModal(true)}
          className="group flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200 flex-1"
        >
          <div
            className={`w-10 h-10 border-2 border-[#484de6] rounded-full bg-[#edebe9] flex items-center justify-center ${
              isProfileNameLoaded ? '' : 'animate-pulse'
            }`}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="User avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            )}
          </div>
          <div className="flex flex-col items-start gap-1">
            {isProfileNameLoaded ? (
              <p className="text-gray-900 text-base font-medium">{displayName}</p>
            ) : (
              <div
                className="h-4 w-36 rounded bg-gray-200 animate-pulse"
                aria-label="Loading profile name"
              />
            )}
            {isProfileRoleLoaded ? (
              <p className="text-gray-500 text-xs">{displayRole}</p>
            ) : (
              <div
                className="h-3 w-20 rounded bg-gray-200 animate-pulse"
                aria-label="Loading profile role"
              />
            )}
          </div>
          <div className="ml-auto flex items-center">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#d9d9d9] text-gray-700 transition group-hover:bg-[#c5c5c5] group-hover:rotate-90">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>

      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 py-[200px] px-4">
          <div className="w-full max-w-2xl rounded-[32px] border-[4px] border-[#CCCCCC] bg-[#F8F8F8] px-12 py-10 shadow-[3px_12px_80px_10px_rgba(34,34,34,0.10)]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
              <CloseButton onClick={() => setShowUserModal(false)} size="sm" />
            </div>

            {saveState !== 'idle' && saveState !== 'saving' && saveMessage && (
              <div
                className={`fixed left-1/2 top-8 z-[60] flex w-[90%] max-w-xl -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-3 text-sm shadow-lg ${
                  saveState === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
                aria-live="polite"
              >
                {saveState === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <p>{saveMessage}</p>
              </div>
            )}

          <div className="mt-20 flex flex-col gap-8">
              {/* Profile Cluster */}
              <div className="flex flex-wrap items-center gap-6">
                <div
                  className="group relative h-24 w-24 cursor-pointer rounded-full border-2 border-[#484de6] bg-[#edebe9] p-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="h-full w-full overflow-hidden rounded-full bg-gray-200">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="User avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-300" />
                    )}
                  </div>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs font-semibold text-white">
                      Uploading…
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <p className="text-xs font-semibold text-white">Update Photo</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarInputChange}
                  />
                </div>

                <div className="flex flex-1 min-w-[240px] items-center gap-6">
                  {roleLabel ? (
                    <span
                      className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ${
                        (audienceRole || roleLabel)?.toLowerCase() === 'student'
                          ? 'border border-orange-200 bg-orange-100 text-orange-600'
                          : 'border border-[#d7dbff] bg-[#eef0ff] text-[#484de6]'
                      }`}
                    >
                      {roleLabel}
                    </span>
                  ) : (
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" aria-label="Loading role" />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter the name shown to others"
                  className="w-full rounded border border-[#E9EAEB] bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#6d74ff] hover:border-[#6d74ff] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-20">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 rounded border border-[#CCCCCC] bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    disabled={isSavingProfile}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded bg-[#484de6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#484de6]/20 transition hover:bg-[#3A3FE4] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    onLogout?.();
                    setShowUserModal(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded border border-transparent bg-[#2D2E34] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#1f2024] cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
