'use client';

import { useState, useEffect } from 'react';
import { Layout3, Header } from '../../../../shared/components/layout';
import { SubmissionsTable, Pagination, SummaryCard } from '../../../../shared/components/ui';
import { CheckCircle2, XCircle, CheckCircle, FileText, Github } from 'lucide-react';
import type { Task } from '../../types';
import type {
  StudentSubmission,
  EducatorSubmissionsMap,
  ApprovedGradesMap
} from '../../types';

interface ClosedTaskReviewProps {
  task: Task;
  submissions: StudentSubmission[];
  onSubmissionClick?: (submission: StudentSubmission) => void;
  educatorSubmissions?: EducatorSubmissionsMap;
  approvedGrades?: ApprovedGradesMap;
  onEducatorSubmission?: (grade: string, feedback: string) => void;
  onApproveGrade?: (grade: 'pass' | 'fail') => void;
}

export default function ClosedTaskReview({
  task,
  submissions,
  onSubmissionClick,
  educatorSubmissions = {},
  approvedGrades = {},
  onEducatorSubmission,
  onApproveGrade
}: ClosedTaskReviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [educatorGrade, setEducatorGrade] = useState<'pass' | 'fail' | null>(null);
  const [educatorFeedback, setEducatorFeedback] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState<{grade: string, source: string} | null>(null);
  const [showApprovalSuccessModal, setShowApprovalSuccessModal] = useState(false);
  const [approvedGrade, setApprovedGrade] = useState<'pass' | 'fail' | null>(null);

  // Initialize form state with existing educator submission data
  useEffect(() => {
    if (selectedSubmission && educatorSubmissions[selectedSubmission.id]) {
      const existingSubmission = educatorSubmissions[selectedSubmission.id];
      setEducatorGrade(existingSubmission.grade as 'pass' | 'fail');
      setEducatorFeedback(existingSubmission.feedback);
    } else {
      setEducatorGrade(null);
      setEducatorFeedback('');
    }
  }, [selectedSubmission, educatorSubmissions]);

  // Calculate dynamic values
  const totalSubmissions = submissions.length;
  const passCount = submissions.filter(sub => sub.aiAssessment.overall === 'pass').length;
  const failCount = totalSubmissions - passCount;

  const tableSubmissions = submissions.map((submission) => {
    const educatorSubmission = educatorSubmissions?.[submission.id];
    const isApproved = approvedGrades?.[submission.id];
    const educatorGradingStatus = educatorSubmission
      ? (isApproved ? educatorSubmission.grade : 'submitted')
      : 'pending';

    return {
      id: submission.id,
      name: submission.studentName,
      status: submission.status,
      date: submission.submissionDate,
      studentName: submission.studentName,
      educatorAssessment: educatorSubmission?.grade ?? 'Pending',
      educatorGradingStatus,
      dateTime: submission.submissionDate,
      hensAssessment: submission.aiAssessment.overall
    };
  });

  // Pagination logic
  const totalPages = Math.ceil(tableSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = tableSubmissions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle submission click - update selected submission instead of opening modal
  const handleSubmissionClick = (submission: { id: number }) => {
    const original = submissions.find((item) => item.id === submission.id) ?? null;
    setSelectedSubmission(original);
    if (original) {
      onSubmissionClick?.(original);
    }
  };

  // Generate mock schedule for closed tasks (less colorful)
  const generateMockSchedule = (dueDate: number) => {
    const now = new Date();
    const startDate = new Date(now.getTime() + (dueDate + 5) * 24 * 60 * 60 * 1000); // 5 days before due
    const endDate = new Date(now.getTime() + dueDate * 24 * 60 * 60 * 1000);
    
    return {
      startDate,
      endDate
    };
  };

  const schedule = generateMockSchedule(task.dueDate);

  return (
    <>
    <Layout3
      header={
        <Header
          title=""
          subtitle="Review Closed Task"
          taskTitle={task.title}
          scheduledStart={schedule.startDate}
          scheduledEnd={schedule.endDate}
          actions={null}
        />
      }
      leftContent={
        <div className="flex flex-col gap-6 items-start p-6 h-full overflow-hidden">
          {/* Title */}
          <div className="w-full">
            <h2 className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[24px] tracking-[0.48px]">
              Submissions
            </h2>
          </div>

          {/* Summary Cards */}
          <div className="flex gap-4 items-start w-full">
            {/* Total Submissions */}
            <SummaryCard
              title="Total Submissions"
              value={totalSubmissions.toString()}
              className="bg-[#f0f9ff] border-[#bae6fd] text-[#0c4a6e]"
            />

            {/* Task Clarity */}
            <SummaryCard
              title="Task Clarity"
              className="bg-[#fefce8] border-[#fde047] text-[#713f12]"
            >
              <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className={`w-[15px] h-[15px] rounded-full ${
                      index < (task.clarityScore || 4) ? 'bg-yellow-400' : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>
            </SummaryCard>

            {/* Assessment Results */}
            <SummaryCard
              title="Assessment Results"
              className="bg-[#f0fdf4] border-[#bbf7d0] text-[#14532d]"
            >
              <div className="box-border content-stretch flex gap-[32px] items-center justify-center overflow-clip px-[8px] py-0 relative rounded-[inherit] size-full">
                <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0">
                  <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                    <p className="font-['Helvetica_Neue:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#027a48] text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
                      {passCount} Pass
                    </p>
                  </div>
                  <div className="relative shrink-0 size-[20px]">
                    <CheckCircle2 className="w-5 h-5 text-white fill-green-500" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0">
                  <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                    <p className="font-['Helvetica_Neue:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#e13838] text-[16px] text-nowrap tracking-[0.28px] whitespace-pre">
                      {failCount} Fail
                    </p>
                  </div>
                  <div className="relative shrink-0 size-[20px]">
                    <XCircle className="w-5 h-5 text-white fill-red-400" />
                  </div>
                </div>
              </div>
            </SummaryCard>
          </div>

          {/* Submissions Table */}
          <div className="flex-1 w-full overflow-hidden">
            <SubmissionsTable
              submissions={currentSubmissions}
              onSubmissionClick={handleSubmissionClick}
              className="h-full"
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="w-full flex justify-center pt-[12px]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      }
      rightContent={
        <div className="flex flex-col h-full max-h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedSubmission ? (
            <>
              {/* Student Info and Status */}
              <div className="flex gap-4 items-start w-full">
                {/* Student Name */}
                <div className="flex flex-col gap-2 flex-1">
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
                    Student Name
                  </p>
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px]">
                    {selectedSubmission.studentName}
                  </p>
                </div>

                {/* Submission Date/Time */}
                <div className="flex flex-col gap-2 flex-1">
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
                    Submission Date/Time
                  </p>
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px]">
                    {selectedSubmission.dateTime}
                  </p>
                </div>
              </div>

              {/* Educator Assessment - Always Editable */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900">Educator&rsquo;s Assessment</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Grade Selection */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Grade <span className="text-red-500">*</span>
                        </label>
                        {selectedSubmission && approvedGrades[selectedSubmission.id] && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Pass Option */}
                        <label className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          educatorGrade === 'pass'
                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                            : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-25'
                        }`}>
                          <input
                            type="radio"
                            name="grade"
                            value="pass"
                            checked={educatorGrade === 'pass'}
                            onChange={() => setEducatorGrade('pass')}
                            className="sr-only"
                          />
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              educatorGrade === 'pass'
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                              {educatorGrade === 'pass' && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className={`w-4 h-4 ${
                                educatorGrade === 'pass' ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              <span className={`text-sm font-medium ${
                                educatorGrade === 'pass' ? 'text-green-700' : 'text-gray-700'
                              }`}>
                                Pass
                              </span>
                            </div>
                          </div>
                        </label>

                        {/* Fail Option */}
                        <label className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          educatorGrade === 'fail'
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                            : 'border-gray-300 bg-white hover:border-red-300 hover:bg-red-25'
                        }`}>
                          <input
                            type="radio"
                            name="grade"
                            value="fail"
                            checked={educatorGrade === 'fail'}
                            onChange={() => setEducatorGrade('fail')}
                            className="sr-only"
                          />
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              educatorGrade === 'fail'
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-300'
                            }`}>
                              {educatorGrade === 'fail' && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <XCircle className={`w-4 h-4 ${
                                educatorGrade === 'fail' ? 'text-red-600' : 'text-gray-400'
                              }`} />
                              <span className={`text-sm font-medium ${
                                educatorGrade === 'fail' ? 'text-red-700' : 'text-gray-700'
                              }`}>
                                Fail
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Feedback Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Feedback
                        </label>
                        {selectedSubmission && approvedGrades[selectedSubmission.id] && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">
                          Provide constructive feedback to help the student improve
                        </p>
                        <textarea
                          value={educatorFeedback}
                          onChange={(e) => setEducatorFeedback(e.target.value)}
                          placeholder="Enter your feedback here..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none transition-colors"
                          style={{ minHeight: '80px' }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Optional but recommended</span>
                          <span>{educatorFeedback.length}/500</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Hens (AI) Assessment */}
              <div className="flex flex-col gap-3 w-full">
                {/* AI Assessment Header */}
                <div className="flex gap-4 items-end">
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
                    Hens(AI) Assessment
                  </p>
                  <div className="flex gap-1 items-center">
                    <CheckCircle className="w-4 h-4 text-[#027a48]" />
                    <p className="font-['Helvetica_Neue:Bold',sans-serif] text-[#027a48] text-[16px] tracking-[0.32px]">
                      {selectedSubmission.aiAssessment.overall === 'pass' ? 'Pass' : 'Fail'}
                    </p>
                  </div>
                </div>

                {/* AI Assessment Content - Compact */}
                <div className="bg-[#f6fef9] border border-[#a6f4c5] border-solid box-border flex flex-col gap-2 pl-3 pr-4 py-3 rounded-[8px] w-full max-h-48 overflow-y-auto">
                  <ul className="flex flex-col gap-2 list-disc ml-4 font-['Helvetica_Neue:Regular',sans-serif] text-[#181d27] text-[14px] tracking-[0.28px] leading-[20px]">
                    {selectedSubmission.aiAssessment.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Student Note */}
              <div className="flex flex-col gap-2 w-full">
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
                  Student Note
                </p>
                
                <div className="bg-[#fdfdfd] border border-[#d5d7da] border-solid box-border flex flex-col gap-2 pl-3 pr-4 py-3 rounded-[8px] w-full max-h-32 overflow-y-auto">
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#414651] text-[14px] tracking-[0.28px] leading-[20px]">
                    {selectedSubmission.studentNote}
                  </p>
                </div>

                {/* Attachments */}
                <div className="flex gap-1 items-start w-full">
                  {selectedSubmission.attachments.map((attachment) => (
                    <div
                      key={`${attachment.type}-${attachment.name}`}
                      className="bg-[#fdfdfd] border border-[#d5d7da] border-solid box-border flex flex-col gap-1 items-center justify-center flex-1 pb-2 pt-3 rounded-[8px] cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {attachment.type === 'pdf' ? (
                        <FileText className="w-5 h-5 text-[#414651]" />
                      ) : (
                        <Github className="w-5 h-5 text-[#414651]" />
                      )}
                      <div className="flex flex-col gap-0.5 items-center">
                        <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#414651] text-[12px] tracking-[0.24px] text-center">
                          {attachment.name}
                        </p>
                        <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#414651] text-[12px] tracking-[0.24px]">
                          {attachment.size}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          ) : (
            <div className="flex flex-col gap-4 items-center justify-center h-full text-center">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[18px] tracking-[0.36px]">
                Select a submission to view details
              </p>
            </div>
          )}
          </div>
          
          {/* Action Buttons - Always Visible at Bottom */}
          <div className="flex gap-1 items-start w-full p-6 pt-4 border-t border-gray-200 bg-white">
              {/* Cancel Button */}
              <button
                onClick={() => setSelectedSubmission(null)}
                disabled={!selectedSubmission}
                className={`border-solid box-border flex items-center justify-center flex-1 py-3 rounded-[4px] transition-colors ${
                  selectedSubmission 
                    ? 'bg-[#fdfdfd] border-[#e9eaeb] cursor-pointer hover:bg-gray-100 hover:border-gray-400' 
                    : 'bg-gray-100 border-gray-300 cursor-not-allowed'
                }`}
              >
                <p className={`font-['Helvetica_Neue:Regular',sans-serif] text-[18px] tracking-[0.36px] ${
                  selectedSubmission ? 'text-[#414651]' : 'text-gray-400'
                }`}>
                  Cancel
                </p>
              </button>

              {/* Approve Grade Button */}
              {selectedSubmission ? (
                <button
                  onClick={() => {
                    // If educator has provided input, use that; otherwise use Hens AI assessment
                    if (educatorGrade) {
                      const trimmedFeedback = educatorFeedback.trim();
                      onEducatorSubmission?.(educatorGrade, trimmedFeedback);
                      onApproveGrade?.(educatorGrade);
                      setApprovedGrade(educatorGrade);
                      setShowApprovalSuccessModal(true);
                    } else {
                      // Use Hens AI assessment as default - show modal first
                      const hensGrade = selectedSubmission.aiAssessment.overall;
                      setApprovalData({
                        grade: hensGrade,
                        source: 'Hens AI Assessment'
                      });
                      setShowApprovalModal(true);
                    }
                  }}
                  className="bg-[#444ce7] border-[#444ce7] border-solid box-border flex gap-2 items-center justify-center flex-1 py-3 rounded-[4px] cursor-pointer hover:bg-[#3A3FE4] transition-colors"
                >
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-white text-[18px] tracking-[0.36px]">
                    Approve Grade
                  </p>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <CheckCircle2 className="w-4 h-4 text-white -ml-1" />
                  </div>
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-100 border-gray-300 border-solid box-border flex gap-2 items-center justify-center flex-1 py-3 rounded-[4px] cursor-not-allowed"
                >
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-gray-400 text-[18px] tracking-[0.36px]">
                    Select Submission
                  </p>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    <CheckCircle2 className="w-4 h-4 text-gray-400 -ml-1" />
                  </div>
                </button>
              )}
            </div>
        </div>
      }
    />

    {/* Approval Confirmation Modal */}
    {showApprovalModal && approvalData && (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Approve Grade</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-3">
              You haven&rsquo;t provided a custom assessment. The system will use:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-gray-900">Grade:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  approvalData.grade === 'pass' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {approvalData.grade === 'pass' ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Source:</span>
                <span className="text-gray-600">{approvalData.source}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const gradeFromModal = approvalData.grade as 'pass' | 'fail';
                onEducatorSubmission?.(gradeFromModal, '');
                onApproveGrade?.(gradeFromModal);
                setApprovedGrade(gradeFromModal);
                setShowApprovalSuccessModal(true);
                setShowApprovalModal(false);
                setApprovalData(null);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve Grade
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Approval Success Modal */}
    {showApprovalSuccessModal && (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Grade Approved</h3>
          </div>
          
            <p className="text-gray-600 mb-4">
              The student&rsquo;s grade was approved successfully.
          </p>

          {approvedGrade && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <span className="text-sm font-medium text-gray-900">Approved Grade:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                approvedGrade === 'pass'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {approvedGrade === 'pass' ? 'Pass' : 'Fail'}
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setShowApprovalSuccessModal(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
