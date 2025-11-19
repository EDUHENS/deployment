'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { SummaryCard, SubmissionsTable, SubmissionModal, StarRating } from '../../../../shared/components/ui';
import type { StudentSubmission } from '../../types';

interface StudentSubmissionsProps {
  taskTitle: string;
  submissions: StudentSubmission[];
  onApproveSubmission: (submissionId: number) => void;
  onViewSubmission: (submissionId: number) => void;
  avgClarityScore?: number | null;
}

export default function StudentSubmissions({ 
  submissions, 
  onApproveSubmission, 
  onViewSubmission,
  avgClarityScore = null
}: StudentSubmissionsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  // Calculate summary data
  const totalSubmissions = submissions.length;
  const passCount = submissions.filter(s => s.aiAssessment.overall === 'pass').length;
  const failCount = submissions.filter(s => s.aiAssessment.overall === 'fail').length;
  const clarityScore = typeof avgClarityScore === 'number' ? avgClarityScore : null;

  // Convert submissions to table format
  const tableSubmissions = submissions.map(submission => ({
    id: submission.id,
    studentName: submission.studentName,
    educatorAssessment: submission.status,
    dateTime: submission.submissionDate,
    hensAssessment: submission.aiAssessment.overall
  }));

  const handleRowClick = (submission: { id: number; studentName: string; educatorAssessment: string; dateTime: string; hensAssessment: string }) => {
    const fullSubmission = submissions.find(s => s.id === submission.id);
    if (fullSubmission) {
      setSelectedSubmission(fullSubmission);
      onViewSubmission(fullSubmission.id);
    }
  };

  const handleApproveSubmission = () => {
    if (selectedSubmission) {
      onApproveSubmission(selectedSubmission.id);
      setSelectedSubmission(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-[#f8f8f8] flex flex-col gap-1 items-start overflow-clip pb-6 pt-4 px-4 relative shrink-0 w-full">
        <div className="flex gap-1 items-center relative shrink-0 w-full">
          <div className="flex flex-col gap-1 grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#222222] text-[20px] tracking-[0.4px] w-full">
              Submissions
            </p>
            <div className="flex gap-8 items-center relative shrink-0 w-full">
              <div className="flex gap-2 items-center relative shrink-0">
                <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#222222] text-[16px] text-nowrap tracking-[0.32px] whitespace-pre">
                  Assessment type Pass / Fail
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-2 items-start px-4 py-0 relative shrink-0 w-full">
        <SummaryCard
          title="Total Submissions"
          value={totalSubmissions}
          type="total"
        />
        <SummaryCard title="Task Clarity">
          {clarityScore !== null ? (
            <StarRating rating={Math.max(0, Math.min(5, clarityScore))} />
          ) : (
            <p className="text-sm text-gray-500">No clarity data</p>
          )}
        </SummaryCard>
        <SummaryCard
          title="Assessment Results"
          value=""
          type="assessment"
          passCount={passCount}
          failCount={failCount}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <>
            <SubmissionsTable
              submissions={tableSubmissions}
              onRowClick={handleRowClick}
              className="mb-6"
            />
            
            {/* Pagination removed - handled by parent component */}
          </>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={handleApproveSubmission}
        />
      )}
    </div>
  );
}
