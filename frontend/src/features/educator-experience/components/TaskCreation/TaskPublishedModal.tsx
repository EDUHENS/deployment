'use client';

import { CircleX, Calendar, Clock } from 'lucide-react';

interface TaskPublishedModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
}

export default function TaskPublishedModal({ 
  isOpen, 
  onClose, 
  taskTitle,
  scheduledStart,
  scheduledEnd 
}: TaskPublishedModalProps) {
  if (!isOpen) return null;

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
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
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-[#f8f8f8] border-4 border-[#cccccc] border-solid relative rounded-[32px] w-full h-auto max-w-2xl flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 hover:animate-rotate-360 transition-colors duration-200 cursor-pointer"
        >
          <CircleX className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="flex flex-col gap-8 items-center p-12">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-3 items-center text-center">
            <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[28px] tracking-[0.56px]">
              Task Published Successfully! 🎉
            </h2>
            <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[16px] tracking-[0.32px] max-w-md">
              Your task &ldquo;{taskTitle}&rdquo; has been published and is now available to students.
            </p>
          </div>

          {/* Schedule Info */}
          {(scheduledStart || scheduledEnd) && (
            <div className="flex flex-col gap-4 w-full bg-white rounded-lg p-6 border border-[#cccccc]">
              <h3 className="font-['Helvetica_Neue:Medium',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                Task Schedule
              </h3>
              
              {scheduledStart && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#484de6]" />
                  <div className="flex flex-col">
                    <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[12px]">
                      Opens on
                    </span>
                    <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#222222] text-[14px]">
                      {formatDateTime(scheduledStart)}
                    </span>
                  </div>
                </div>
              )}

              {scheduledEnd && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#F15A24]" />
                  <div className="flex flex-col">
                    <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[12px]">
                      Closes on
                    </span>
                    <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[#222222] text-[14px]">
                      {formatDateTime(scheduledEnd)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={onClose}
            className="bg-[#484de6] border-[#6976eb] border-[3px] border-solid box-border content-stretch cursor-pointer flex gap-[7px] items-center justify-center px-[32px] py-[16px] relative rounded-[4px] hover:bg-[#3A3FE4] transition-colors duration-200"
          >
            <span className="font-['Helvetica_Neue:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#f8f8f8] text-[16px] text-nowrap whitespace-pre">
              View All Tasks
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
