'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { updateMe } from '@/services/authApi';
import TaskItem from './TaskItem';
import { Search, Minimize2, Maximize2, X, LogOut, FileText } from 'lucide-react';
import type { Task } from '../../educator-experience/types';

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
  /** When true, render tasks as simple rows (status dot + title) without expanders */
  simpleTasks?: boolean;
  /** When true, render TaskItem but keep it collapsed (no expansion), clicking row triggers onTaskClick */
  disableExpand?: boolean;
  onLogout?: () => void;
  onProfileUpdated?: () => void;
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
  simpleTasks = false,
  disableExpand = false,
  onLogout,
  onProfileUpdated,
}: SidebarProps) {
  // TODO(db): When a task is selected, fetch its latest form/submission state from API.
  // - Use task.id to request GET /tasks/:id and GET /tasks/:id/form
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Array<string | number>>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState(userProfile?.name || 'Dr. Sarah Johnson');
  const roleLabel = userProfile?.role ?? 'Educator';

  // Keep local editable name in sync with incoming profile
  useEffect(() => {
    if (userProfile?.name && userProfile.name !== userName) {
      setUserName(userProfile.name);
    }
  }, [userProfile?.name]);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(localSearchQuery.toLowerCase())
  );

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

  if (isMinimized) {
    return (
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
                            task.dueDate < 0
                              ? 'bg-gray-400'
                              : task.dueDate <= 2
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
                      {task.dueDate < 0 ? 'Overdue' :
                       task.dueDate <= 2 ? 'Due Soon' : 'On Track'}
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
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
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
            {filteredTasks.length === 0 ? (
              <p className="text-gray-400 text-sm px-2">
                {localSearchQuery?.trim()
                  ? `No tasks match "${localSearchQuery.trim()}"`
                  : 'You have not published any tasks yet.'}
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
                        task.dueDate < 0 ? 'bg-gray-400' : task.dueDate <= 2 ? 'bg-orange-500' : 'bg-green-500'
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
                  isExpanded={disableExpand ? false : expandedTaskIds.includes(task.id)}
                  onToggle={disableExpand ? (() => onTaskClick?.(task)) : (() => handleTaskToggle(task.id))}
                  onManageReview={() => (onTaskClick ? onTaskClick(task) : handleManageReview(task))}
                  submissions={task.submissions}
                  timeLeft={task.timeLeft}
                  clarityScore={task.clarityScore}
                  isDraft={task.isDraft}
                  hideChevron={disableExpand}
                />
              )
            ))}
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-[#f8f8f8] border-t border-[#e6e6e6] flex flex-col gap-2 items-stretch p-6 w-full">
        {/* Small quick links above the name */}
        <div className="flex items-center justify-between">
          <a
            href="/dashboard-selection"
            className="text-xs text-gray-500 underline hover:text-[#484de6]"
            title="Go to Selection"
          >
            Go to Selection
          </a>
          <button
            type="button"
            onClick={() => onLogout?.()}
            className="text-xs text-gray-500 underline hover:text-red-600"
            title="Log out"
          >
            Log out
          </button>
        </div>

        <button
          onClick={() => setShowUserModal(true)}
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200"
        >
          <div className="w-10 h-10 border-2 border-[#484de6] rounded-full bg-[#edebe9] flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>
          <div className="flex flex-col items-start">
            <p className="text-gray-900 text-base font-medium">{userProfile?.name || userName}</p>
            <p className="text-gray-500 text-xs">{userProfile?.role || 'Educator'}</p>
          </div>
        </button>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 py-[200px]">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">User Settings</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:animate-rotate-360 transition-colors duration-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-[#484de6] rounded-full bg-[#edebe9] flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                </div>
                <button className="text-[#484de6] text-base font-medium hover:underline cursor-pointer">
                  Change Profile Picture
                </button>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#484de6] focus:border-transparent"
                />
              </div>

              {/* Role Display */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {roleLabel}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const trimmed = (userName || '').trim();
                    if (trimmed) {
                      // Split into first/last; backend also accepts full_name
                      const parts = trimmed.split(/\s+/);
                      const first = parts.shift() || '';
                      const last = parts.join(' ');
                      await updateMe({ firstName: first, lastName: last, fullName: trimmed });
                    }
                    // Ask parent to refresh profile from backend
                    onProfileUpdated?.();
                    setShowUserModal(false);
                  } catch (e) {
                    console.error('Failed to save profile name', e);
                  }
                }}
                className="flex-1 px-4 py-2 bg-[#484de6] text-white rounded-lg hover:bg-[#3A3FE4] transition-colors duration-200 cursor-pointer"
              >
                Save Changes
              </button>
            </div>

            {/* Logout Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  onLogout?.();
                  setShowUserModal(false);
                }}
                className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
