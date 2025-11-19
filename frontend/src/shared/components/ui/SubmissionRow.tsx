'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';

interface SubmissionRowProps {
  studentName: string;
  studentAvatarUrl?: string;
  educatorAssessment: string;
  educatorGradingStatus?: string; // New field for educator grading status
  dateTime: string;
  hensAssessment: 'pass' | 'fail' | 'pending';
  className?: string;
  onClick?: () => void;
}

export default function SubmissionRow({
  studentName,
  studentAvatarUrl,
  educatorAssessment,
  educatorGradingStatus,
  dateTime,
  hensAssessment,
  className = '',
  onClick
}: SubmissionRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`bg-white border-[#e6e6e6] border-[0px_0px_1px] border-solid box-border content-stretch flex gap-[2px] h-[83px] items-center relative shrink-0 w-full transition-all duration-200 cursor-pointer ${
        isHovered ? 'ml-2 bg-white' : ''
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Student Name */}
      <div className="basis-0 box-border content-stretch flex gap-[10px] grow items-center min-h-px min-w-px overflow-clip px-[16px] py-[32px] relative shrink-0">
        {studentAvatarUrl && (
          <div className="size-[24px] shrink-0 overflow-hidden rounded-full border border-[#484de6]">
            <img
              src={studentAvatarUrl}
              alt={studentName}
              className="size-full object-cover"
            />
          </div>
        )}
        <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#222222] text-[16px] text-nowrap tracking-[0.32px] whitespace-pre">
          {studentName}
        </p>
      </div>
      
      {/* Educator Assessment */}
      <div className="basis-0 box-border content-stretch flex gap-[10px] grow h-full items-center min-h-px min-w-px overflow-clip pl-0 pr-[16px] py-0 relative rounded-[4px] shrink-0">
        {educatorGradingStatus === 'pending' ? (
          <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717680] text-[16px] text-nowrap tracking-[0.32px] whitespace-pre">
            Pending
          </p>
        ) : educatorGradingStatus === 'submitted' ? (
          <div className="bg-[#fff3cd] border border-[#ffeaa7] border-solid box-border flex items-center justify-center px-3 py-1 rounded-[4px]">
            <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#856404] text-[14px] tracking-[0.28px]">
              Submitted
            </p>
          </div>
        ) : educatorGradingStatus === 'pass' || educatorGradingStatus === 'fail' ? (
          <StatusBadge status={educatorGradingStatus as 'pass' | 'fail'} />
        ) : (
          <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717680] text-[16px] text-nowrap tracking-[0.32px] whitespace-pre">
            {educatorAssessment}
          </p>
        )}
      </div>
      
      {/* Date/Time */}
      <div className="basis-0 box-border content-stretch flex font-['Helvetica_Neue:Regular',sans-serif] gap-[10px] grow items-center leading-[normal] min-h-px min-w-px not-italic overflow-clip pl-0 pr-[16px] py-[32px] relative shrink-0 text-[#535862] text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
        <p className="relative shrink-0">
          {dateTime.split(' ')[0]}
        </p>
        <p className="relative shrink-0">
          {dateTime.split(' ')[1]}
        </p>
      </div>
      
      {/* Hens Assessment */}
      <div className="basis-0 box-border content-stretch flex gap-[10px] grow h-full items-center min-h-px min-w-px overflow-clip pl-0 pr-[16px] py-0 relative rounded-[4px] shrink-0">
        <StatusBadge status={hensAssessment} />
      </div>
    </div>
  );
}
