'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronDown, ArrowRight, FileText } from 'lucide-react';
import { useRealtimeDate, calculateDaysUntilDue, toFinlandTime } from '../../shared/hooks/useRealtimeDate';

export interface TaskItemProps {
  // CHANGED: optional id to support future DB-driven behaviors
  id?: string | number;
  title: string;
  dueDate: number | Date | string | null; // days until due, or actual due date for real-time calculation
  dueAt?: string | Date | null;
  updatedAt?: string | null;
  isExpanded?: boolean;
  onToggle?: () => void;
  onManageReview?: () => void;
  submissions?: number;
  timeLeft?: string;
  clarityScore?: number;
  isHovered?: boolean; // Prop to control hover state from parent if needed
  isDraft?: boolean; // New prop to identify draft tasks
  isArchived?: boolean; // True if task is archived/closed
  hideChevron?: boolean; // When true, do not render chevron icon
}

export default function TaskItem({
  title,
  dueDate,
  dueAt = null,
  updatedAt = null,
  isExpanded = false,
  onToggle,
  onManageReview,
  submissions = 0,
  timeLeft = '',
  clarityScore,
  isHovered = false,
  isDraft = false,
  isArchived = false,
  hideChevron = false
}: TaskItemProps) {
  // TODO(db): Use `id` (if provided) to send analytics or fetch per-task details.
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const isHoveredState = isHovered || isLocalHovered;
  const currentDate = useRealtimeDate();
  const initialReference = useRef<Date | null>(null);
  if (!initialReference.current) {
    initialReference.current = currentDate;
  }

  // Calculate real-time days until due
  const daysUntilDue = typeof dueDate === 'number' 
    ? dueDate 
    : calculateDaysUntilDue(dueDate, currentDate);

  const resolvedDueDate = useMemo(() => {
    if (dueAt) {
      try {
        return toFinlandTime(dueAt);
      } catch {
        return null;
      }
    }
    if (dueDate instanceof Date) {
      return dueDate;
    }
    if (typeof dueDate === 'string' && dueDate) {
      try {
        return toFinlandTime(dueDate);
      } catch {
        return null;
      }
    }
    if (typeof dueDate === 'number' && Number.isFinite(dueDate)) {
      const base = initialReference.current ?? currentDate;
      return new Date(base.getTime() + dueDate * 24 * 60 * 60 * 1000);
    }
    return null;
  }, [dueAt, dueDate]);

  const formattedTimeLeft = useMemo(() => {
    if (isDraft) return 'Draft';
    if (isArchived) return 'Closed';
    if (!resolvedDueDate) return timeLeft || 'No due date';

    const diffMs = resolvedDueDate.getTime() - currentDate.getTime();
    if (diffMs <= 0) {
      return '0h 0m';
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [resolvedDueDate, currentDate, isDraft, isArchived, timeLeft]);

  // Determine status color based on due date (real-time)
  const getStatusColor = () => {
    if (isArchived) return 'bg-gray-400'; // Closed/archived tasks (GREY)
    if (isDraft) return null; // Draft tasks don't use status circles
    if (daysUntilDue < 0) return 'bg-gray-400'; // Overdue (GREY)
    if (daysUntilDue <= 2) return 'bg-[#F79009]'; // Due in 2 days or less (ORANGE)
    return 'bg-[#12B76A]'; // More than 2 days (GREEN)
  };

  // Render status indicator (circle for regular/closed tasks, document icon for drafts)
  const renderStatusIndicator = () => {
    if (isDraft) {
      return <FileText className="w-5 h-5 text-purple-300 fill-current" />;
    }
    // Closed/archived tasks show grey circle (no icon)
    return <div className={`status-circle ${getStatusColor()}`}></div>;
  };

  // Render stars for clarity score (tiny stars)
  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full ${index < score ? 'bg-yellow-400' : 'bg-gray-300'}`}
      ></div>
    ));
  };

  const formattedDraftSaved = useMemo(() => {
    if (!updatedAt) return 'Not saved yet';
    const parsed = new Date(updatedAt);
    if (Number.isNaN(parsed.getTime())) return 'Not saved yet';
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [updatedAt]);

  if (isExpanded) {
    return (
      <div
        className={`flex flex-col gap-2.5 items-start overflow-clip p-2 rounded w-full transition-all duration-200 ${
          isHoveredState ? 'ml-2 bg-white' : ''
        }`}
        onMouseEnter={() => setIsLocalHovered(true)}
        onMouseLeave={() => setIsLocalHovered(false)}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <div className="flex gap-1 grow items-center min-h-0 min-w-0">
            <div className="flex gap-2 items-center max-w-[240px] overflow-clip">
              {renderStatusIndicator()}
              <p className="text-gray-900 text-base leading-normal tracking-[0.28px] text-left">
                {title}
              </p>
            </div>
          </div>
          {hideChevron ? null : (
            <div className="flex items-center self-stretch">
              <div className="flex gap-2.5 h-full items-center justify-center overflow-clip px-1.5 py-2">
                <ChevronDown className={`w-4 h-4 text-gray-600 fill-current transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isHoveredState ? '-translate-y-0.5' : ''}`} />
              </div>
            </div>
          )}
        </button>

        {/* Expanded Content */}
        <div className="flex flex-col gap-1 items-start p-2 rounded-xl w-full">
          {isDraft ? (
            // Draft task expanded content
            <>
              {/* Draft saved status */}
              <div className="bg-purple-50 flex items-start justify-between p-2 rounded w-full">
                <p className="text-gray-900 text-base">Draft saved</p>
                <p className="text-gray-900 text-base">{formattedDraftSaved}</p>
              </div>
            </>
          ) : (
            // Regular task expanded content
            <>
              {/* Submissions */}
              <div className="bg-purple-50 flex items-start justify-between p-2 rounded w-full">
                <p className="text-gray-900 text-base">Submissions</p>
                <p className="text-gray-900 text-base">{submissions}</p>
              </div>

              {/* Time left */}
              <div className="bg-orange-50 flex items-start justify-between p-2 rounded w-full">
                <p className="text-gray-900 text-base">Time left</p>
                <p className="text-gray-900 text-base">{formattedTimeLeft}</p>
              </div>

              {/* Clarity Score */}
              <div className="bg-yellow-50 flex items-start justify-between p-2 rounded w-full">
                <p className="text-gray-900 text-base">Clarity Score</p>
                <div className="flex gap-1 items-start min-h-[20px]">
                  {typeof clarityScore === 'number' && clarityScore > 0 ? (
                    renderStars(Math.min(5, Math.max(0, Math.round(clarityScore))))
                  ) : (
                    <span className="text-sm text-gray-500">No clarity data</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Manage & Review Button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onManageReview?.();
          }}
          className="bg-white border border-gray-300 flex gap-1 items-center justify-center px-4 py-3 rounded w-full cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
        >
          <p className="text-gray-600 text-base">
            {isDraft ? 'Manage & Publish' : (daysUntilDue < 0 ? 'Review' : 'Manage & Review')}
          </p>
          <ArrowRight className="w-4 h-4 text-gray-600 fill-current" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2.5 items-start overflow-clip p-2 rounded w-full transition-all duration-200 ${
        isHoveredState ? 'ml-2 bg-white' : ''
      }`}
      onMouseEnter={() => setIsLocalHovered(true)}
      onMouseLeave={() => setIsLocalHovered(false)}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full cursor-pointer"
      >
        <div className="flex gap-1 grow items-center min-h-0 min-w-0">
          <div className="flex gap-2 items-center max-w-[240px] overflow-clip">
            {renderStatusIndicator()}
            <p className="text-gray-900 text-base leading-normal tracking-[0.28px] truncate">
              {title}
            </p>
          </div>
        </div>
        {hideChevron ? null : (
          <div className="flex items-center self-stretch">
            <div className="flex gap-2.5 h-full items-center justify-center overflow-clip px-1.5 py-2">
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isHoveredState ? '-translate-y-0.5' : ''}`} />
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
