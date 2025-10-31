'use client';

import { ReactNode } from 'react';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  taskTitle?: string; // Dynamic task title
}

export default function Header({ title, subtitle, actions, className = '', scheduledStart, scheduledEnd, taskTitle }: HeaderProps) {
  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return null;
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <div className={`bg-[#f8f8f8] box-border content-stretch flex items-end justify-between pb-[16px] pt-[32px] px-[16px] relative size-full gap-[48px] ${className}`}>
      {/* COLUMN 1: Page Info and Task Title */}
      <div className="flex flex-col gap-[8px] shrink-0">
        {/* Page Title: Task Lab / Create New Task */}
        <div className="flex items-center gap-[8px]">
          {title && (
            <>
              <p className="font-['Helvetica_Neue:Medium', sans-serif] leading-[1.2] not-italic text-[#222222] text-[22px] tracking-[0.4px]">
                {title}
              </p>
              {subtitle && (
                <>
                  <span className="font-['Helvetica_Neue:Medium', sans-serif] text-[#999999] text-[22px]">/</span>
                  <p className="font-['Helvetica_Neue:Regular', sans-serif] leading-[1.2] not-italic text-[#222222] text-[22px] tracking-[0.4px]">
                    {subtitle}
                  </p>
                </>
              )}
            </>
          )}
          {!title && subtitle && (
            <p className="font-['Helvetica_Neue:Regular', sans-serif] leading-[1.2] not-italic text-[#222222] text-[22px] tracking-[0.4px]">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Task Title */}
        {taskTitle && (
              <p className="font-['Helvetica_Neue:Regular', sans-serif] leading-[1.5] not-italic text-[#222222] text-[18px] tracking-[0.32px] max-w-[300px] truncate">
            {taskTitle}
          </p>
        )}
      </div>
      
      {/* COLUMN 2: Task Schedule */}
      {(scheduledStart || scheduledEnd) && (
        <div className="flex flex-col gap-[4px] shrink-0">
          {scheduledStart && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#484de6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
                  <span className="font-['Helvetica_Neue:Regular', sans-serif] text-[#595959] text-[16px] tracking-[0.28px] whitespace-nowrap">
                Opens: {formatDateTime(scheduledStart)}
              </span>
            </div>
          )}
          {scheduledEnd && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#F15A24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
              </svg>
                  <span className="font-['Helvetica_Neue:Regular', sans-serif] text-[#595959] text-[16px] tracking-[0.28px] whitespace-nowrap">
                Closes: {formatDateTime(scheduledEnd)}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Spacer to push buttons to right */}
      <div className="grow"></div>
      
      {/* COLUMN 3: Action Buttons */}
      {actions && (
        <div className="flex gap-[8px] shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
