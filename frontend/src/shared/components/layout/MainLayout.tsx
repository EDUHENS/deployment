'use client';

import { ReactNode } from 'react';
import { Sidebar } from '../../../features/navigation';
import { Loader2 } from 'lucide-react';
// Use original CSS spinner (in App.css) instead of mascot face
import type { Task } from '../../../features/educator-experience/types';

export interface MainLayoutProps {
  mainDashboard: ReactNode;
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
  simpleTasks?: boolean;
  disableExpand?: boolean;
  onLogout?: () => void;
  onProfileUpdated?: () => void;
  /** Explicit audience to adjust empty-state copy */
  audience?: 'student' | 'educator';
  /** Global loading overlay */
  isLoading?: boolean;
  /** Whether sidebar tasks are still loading */
  isTasksLoading?: boolean;
}

export default function MainLayout({
  mainDashboard,
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
  audience,
  isLoading = false,
  isTasksLoading = false,
}: MainLayoutProps) {
  return (
    <div className="bg-[#E6E6E6] h-screen max-h-screen grid grid-cols-[auto_1fr] gap-px overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isMinimized={isMinimized}
        onToggleMinimize={onToggleMinimize}
        tasks={tasks}
        onTaskClick={onTaskClick}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onLogoClick={onLogoClick}
        userProfile={userProfile}
        simpleTasks={simpleTasks}
        disableExpand={disableExpand}
        onLogout={onLogout}
        onProfileUpdated={onProfileUpdated}
        audience={audience}
        isTasksLoading={isTasksLoading}
      />

      {/* Layout1 */}
      {mainDashboard}
      {isLoading ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin text-[#484de6]" />
        </div>
      ) : null}
    </div>
  );
}
