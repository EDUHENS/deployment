'use client';

import Image from 'next/image';
import SubmissionRow from './SubmissionRow';

interface SimpleSubmission {
  id: number;
  name: string;
  status: string;
  date: string;
  studentName: string;
  educatorAssessment: string;
  educatorGradingStatus?: string; // New field for educator grading status
  dateTime: string;
  hensAssessment: 'pass' | 'fail' | 'pending';
}

interface SubmissionsTableProps {
  submissions: SimpleSubmission[];
  className?: string;
  onSubmissionClick?: (submission: SimpleSubmission) => void;
}

export default function SubmissionsTable({ submissions, className = '', onSubmissionClick }: SubmissionsTableProps) {
  return (
    <div className={`content-stretch flex flex-col items-start relative shrink-0 w-full ${className}`}>
      {/* Header Row */}
      <div className="bg-[#f2f2f2] box-border content-stretch flex items-center px-0 py-[20px] relative rounded-tl-[4px] rounded-tr-[4px] shrink-0 w-full">
        <div className="basis-0 flex flex-row grow items-center self-stretch shrink-0">
          <div className="basis-0 box-border content-stretch flex gap-[10px] grow h-full items-center min-h-px min-w-px overflow-clip px-[16px] py-0 relative shrink-0">
            <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#535862] text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
              Student Name
            </p>
          </div>
        </div>
        <div className="basis-0 flex flex-row grow items-center self-stretch shrink-0">
          <div className="basis-0 box-border content-stretch flex gap-[10px] grow h-full items-center min-h-px min-w-px overflow-clip pl-0 pr-[16px] py-0 relative shrink-0">
            <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#535862] text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
              Educator Assessment
            </p>
          </div>
        </div>
        <div className="basis-0 flex flex-row grow items-center self-stretch shrink-0">
          <div className="basis-0 box-border content-stretch flex gap-[10px] grow h-full items-center min-h-px min-w-px overflow-clip pl-0 pr-[16px] py-0 relative shrink-0">
            <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#535862] text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
              Date/Time
            </p>
          </div>
        </div>
        <div className="basis-0 flex flex-row grow items-center self-stretch shrink-0">
          <div className="basis-0 box-border content-stretch flex gap-[8px] grow h-full items-center min-h-px min-w-px overflow-clip pl-0 pr-[16px] py-0 relative shrink-0">
            <div className="h-[23px] overflow-clip relative shrink-0 w-[20px]">
              <Image
                alt="Hens Assessment"
                className="block max-w-none size-full"
                src="/hens-serious.svg"
                width={20}
                height={23}
              />
            </div>
            <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#535862] text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
              <span className="font-['Nunito_Sans:Bold_Italic',sans-serif] font-bold italic text-[#484de6]">
                Hens
              </span>{" "}
              Assessment
            </p>
          </div>
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="content-stretch flex flex-col gap-[2px] items-start overflow-clip relative rounded-bl-[4px] rounded-br-[4px] shrink-0 w-full">
        <div className="box-border content-stretch flex flex-col items-start pb-[2px] pt-0 px-0 relative shrink-0 w-full">
          {submissions.map((submission) => (
            <SubmissionRow
              key={submission.id}
              studentName={submission.studentName}
              educatorAssessment={submission.educatorAssessment}
              educatorGradingStatus={submission.educatorGradingStatus}
              dateTime={submission.dateTime}
              hensAssessment={submission.hensAssessment}
              onClick={() => onSubmissionClick?.(submission)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
