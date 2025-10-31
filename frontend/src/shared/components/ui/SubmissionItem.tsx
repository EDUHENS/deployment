'use client';

import StatusBadge from './StatusBadge';
import AIAssessmentBadge from './AIAssessmentBadge';

interface SubmissionItemProps {
  id: number;
  studentName: string;
  educatorAssessment: 'pending' | 'approved' | 'needs_revision';
  dateTime: string;
  hensAssessment: 'pass' | 'fail';
  onClick?: (submission: SubmissionItemProps) => void;
  className?: string;
}

export default function SubmissionItem({
  id,
  studentName,
  educatorAssessment,
  dateTime,
  hensAssessment,
  onClick,
  className = ''
}: SubmissionItemProps) {
  const handleClick = () => {
    if (onClick) {
      onClick({
        id,
        studentName,
        educatorAssessment,
        dateTime,
        hensAssessment
      });
    }
  };

  return (
    <div 
      className={`bg-white border-[#e6e6e6] border-[0px_0px_1px] border-solid box-border content-stretch flex gap-[2px] h-[83px] items-center relative shrink-0 w-full hover:bg-gray-50 cursor-pointer transition-colors ${className}`}
      onClick={handleClick}
    >
      {/* Student Name Cell */}
      <div className="basis-0 box-border content-stretch flex gap-[10px] grow items-center min-h-px min-w-px overflow-clip px-[16px] py-[32px] relative shrink-0">
        <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#222222] text-[16px] text-nowrap tracking-[0.32px] whitespace-pre">
          {studentName}
        </p>
      </div>

      {/* Educator Assessment Cell */}
      <div className="basis-0 box-border content-stretch flex gap-[10px] grow items-center min-h-px min-w-px overflow-clip pl-0 pr-[16px] py-[32px] relative shrink-0">
        <StatusBadge status={educatorAssessment} />
      </div>

      {/* Date/Time Cell */}
      <div className="basis-0 box-border content-stretch flex font-['Helvetica_Neue:Regular',sans-serif] gap-[10px] grow items-center leading-[normal] min-h-px min-w-px not-italic overflow-clip pl-0 pr-[16px] py-[32px] relative shrink-0 text-[#535862] text-[14px] text-nowrap tracking-[0.28px] whitespace-pre">
        <p className="relative shrink-0">
          {dateTime.split(' ')[0]}
        </p>
        <p className="relative shrink-0">
          {dateTime.split(' ')[1]}
        </p>
      </div>

      {/* Hens Assessment Cell */}
      <div className="basis-0 box-border content-stretch flex gap-[10px] grow h-full items-center min-h-px min-w-px overflow-clip pl-0 pr-[16px] py-0 relative rounded-[4px] shrink-0">
        <AIAssessmentBadge result={hensAssessment} />
      </div>
    </div>
  );
}
