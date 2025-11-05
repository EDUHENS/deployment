'use client';

import { ReactNode } from 'react';
import { Sidebar } from '../../../features/navigation';
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
      />

      {/* Layout1 */}
      {mainDashboard}
    </div>
  );
}
