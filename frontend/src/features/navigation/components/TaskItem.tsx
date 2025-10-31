'use client';

import { useState } from 'react';
import { ChevronDown, ArrowRight, FileText } from 'lucide-react';

export interface TaskItemProps {
  title: string;
  dueDate: number; // days until due
  isExpanded?: boolean;
  onToggle?: () => void;
  onManageReview?: () => void;
  submissions?: number;
  timeLeft?: string;
  clarityScore?: number;
  isHovered?: boolean; // Prop to control hover state from parent if needed
  isDraft?: boolean; // New prop to identify draft tasks
  hideChevron?: boolean; // When true, do not render chevron icon
}

export default function TaskItem({
  title,
  dueDate,
  isExpanded = false,
  onToggle,
  onManageReview,
  submissions = 0,
  timeLeft = '',
  clarityScore = 0,
  isHovered = false,
  isDraft = false,
  hideChevron = false
}: TaskItemProps) {
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const isHoveredState = isHovered || isLocalHovered;

  // Determine status color based on due date
  const getStatusColor = () => {
    if (isDraft) return null; // Draft tasks don't use status circles
    if (dueDate < 0) return 'bg-gray-400'; // Closed/overdue (GREY)
    if (dueDate <= 2) return 'bg-[#F79009]'; // Due in 2 days or less (ORANGE)
    return 'bg-[#12B76A]'; // More than 2 days (GREEN)
  };

  // Render status indicator (circle for regular tasks, document icon for drafts)
  const renderStatusIndicator = () => {
    if (isDraft) {
      return <FileText className="w-6 h-6 text-gray-600" />;
    }
    return <div className={`status-circle ${getStatusColor()}`}></div>;
  };

  // Render stars for clarity score
  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <div
        key={index}
        className={`status-circle ${index < score ? 'bg-yellow-400' : 'bg-gray-300'}`}
      ></div>
    ));
  };

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
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isHoveredState ? '-translate-y-0.5' : ''}`} />
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
                <p className="text-gray-900 text-base">12.10.2025</p>
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
                <p className="text-gray-900 text-base">{timeLeft}</p>
              </div>

              {/* Clarity Score */}
              <div className="bg-yellow-50 flex items-start justify-between p-2 rounded w-full">
                <p className="text-gray-900 text-base">Clarity Score</p>
                <div className="flex gap-1 items-start">
                  {renderStars(clarityScore)}
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
            {isDraft ? 'Manage & Publish' : (dueDate < 0 ? 'Review' : 'Manage & Review')}
          </p>
          <ArrowRight className="w-4 h-4 text-gray-600" />
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
