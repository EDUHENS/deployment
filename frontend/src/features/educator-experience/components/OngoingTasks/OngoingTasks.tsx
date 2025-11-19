'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout3, Header } from '../../../../shared/components/layout';
import { Pagination, SummaryCard, SubmissionsTable, StarRating } from '../../../../shared/components/ui';
import { TaskCreationForm } from '../TaskCreation';
import { BottomInputBar } from '../TaskCreation';
import type {
  TaskFormData,
  StudentSubmission,
  EducatorSubmissionsMap,
  ApprovedGradesMap
} from '../../types';
import {
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  ArrowLeft,
  Save,
  Calendar
} from 'lucide-react';
import { EyeIcon, CopyIcon, ShareIcon } from '@/shared/components/ui';

// TODO(db): Drive `submissions`, `educatorSubmissions`, and `approvedGrades` from API.
// - Fetch per-task submissions on selection
// - Persist educator decisions and approvals to backend services

interface OngoingTasksProps {
  taskTitle: string;
  submissions: StudentSubmission[];
  taskFormData: TaskFormData;
  onTaskFormChange: (data: TaskFormData) => void;
  formKey?: string | number; // force remount of the form when key changes
  onPublishTask: (data: TaskFormData) => void;
  onModifyTask: (message: string) => void;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  onPreview?: () => void;
  onSaveDraft?: () => void;
  onTaskSchedule?: () => void;
  onSubmissionClick?: (submission: StudentSubmission) => void;
  educatorSubmissions?: EducatorSubmissionsMap;
  approvedGrades?: ApprovedGradesMap;
  hideSubmissionsPanel?: boolean;
  showTaskLink?: boolean;
  taskLink?: string | null;
  modifyLoading?: boolean;
  onCloseTask?: () => void;
  onBackToMain?: () => void; // Handler to return to main screen
  publishLabel?: string;
  onNotify?: (message: string, kind?: 'info' | 'success' | 'error') => void;
  avgClarityScore?: number | null;
}

export default function OngoingTasks({
  taskTitle,
  submissions,
  taskFormData,
  onTaskFormChange,
  formKey,
  onPublishTask,
  onModifyTask,
  scheduledStart,
  scheduledEnd,
  onPreview,
  onSaveDraft,
  onTaskSchedule,
  onSubmissionClick,
  educatorSubmissions,
  approvedGrades,
  hideSubmissionsPanel = false,
  showTaskLink = false,
  taskLink = null,
  modifyLoading = false,
  onCloseTask,
  onBackToMain,
  publishLabel,
  onNotify,
  avgClarityScore
}: OngoingTasksProps) {
  const handleCopyLink = async (event: React.MouseEvent, message = 'Link copied') => {
    event.stopPropagation();
    if (!taskLink) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(taskLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = taskLink;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      onNotify?.(message, 'info');
    } catch (error) {
      console.error('Failed to copy task link', error);
      onNotify?.('Could not copy the link. Please try again.', 'error');
    }
  };
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
      studentAvatarUrl: (submission as any).studentAvatarUrl,
      educatorAssessment: educatorSubmission?.grade ?? 'Pending',
      educatorGradingStatus,
      dateTime: submission.submissionDate,
      hensAssessment: submission.aiAssessment.overall
    };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const submissionsContainerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic items per page based on actual container height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (!submissionsContainerRef.current) return;
      
      // Get the actual height of the submissions container
      const containerHeight = submissionsContainerRef.current.clientHeight;
      
      // Each submission row is exactly 83px (from Figma design)
      const rowHeight = 83;
      
      // Be very conservative - subtract 100px buffer to ensure no partial items
      const availableHeight = containerHeight - 100;
      const maxItems = Math.floor(availableHeight / rowHeight);
      
      // Ensure at least 3 items, maximum 20 items
      const calculatedItems = Math.max(3, Math.min(20, maxItems));
      console.log(`Container height: ${containerHeight}px, Available: ${availableHeight}px, Items per page: ${calculatedItems}`);
      setItemsPerPage(calculatedItems);
    };

    // Calculate with multiple attempts to ensure container is fully rendered
    const timeouts = [
      setTimeout(calculateItemsPerPage, 0),
      setTimeout(calculateItemsPerPage, 100),
      setTimeout(calculateItemsPerPage, 300),
      setTimeout(calculateItemsPerPage, 500),
      setTimeout(calculateItemsPerPage, 1000)
    ];
    
    // Use ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (submissionsContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        calculateItemsPerPage();
      });
      resizeObserver.observe(submissionsContainerRef.current);
    }
    
    // Also calculate on window resize
    window.addEventListener('resize', calculateItemsPerPage);
    
    return () => {
      timeouts.forEach(clearTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, []);

  // Reset current page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Calculate dynamic values
  // Only count rows that have a definitive Hens result (not pending)
  const graded = submissions.filter(sub => sub.aiAssessment.overall === 'pass' || sub.aiAssessment.overall === 'fail');
  const totalSubmissions = graded.length;
  const passCount = graded.filter(sub => sub.aiAssessment.overall === 'pass').length;
  const failCount = graded.filter(sub => sub.aiAssessment.overall === 'fail').length;

  // Calculate pagination
  const totalPages = Math.ceil(tableSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = tableSubmissions.slice(startIndex, endIndex);

  const handleSubmissionSelect = (submission: { id: number }) => {
    const original = submissions.find((item) => item.id === submission.id);
    if (original) {
      onSubmissionClick?.(original);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Render Pass/Fail assessment results
  const renderAssessmentResults = () => {
    return (
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
    );
  };

  return (
    <Layout3
      header={
        <Header
          title=""
          subtitle=""
          taskTitle={taskTitle}
          scheduledStart={scheduledStart}
          scheduledEnd={scheduledEnd}
          leftContent={onBackToMain ? (
            <button
              onClick={onBackToMain}
              className="bg-white border border-[#cccccc] border-solid box-border content-stretch flex gap-[7px] items-center justify-center overflow-visible px-[16px] py-[12px] relative rounded-[4px] shrink-0 hover:bg-gray-50 hover:border-[#999999] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3 text-[#595959] fill-current" />
              <span className="font-['Helvetica_Neue:Regular', sans-serif] leading-[normal] not-italic relative shrink-0 text-[#595959] text-[14px] text-nowrap whitespace-pre">
                Back
              </span>
            </button>
          ) : undefined}
          actions={
            <>
              {/* Preview Button */}
              <button 
                onClick={onPreview}
                className="bg-white border border-[#cccccc] border-solid box-border content-stretch flex gap-[7px] items-center justify-center max-w-[160px] overflow-visible px-[16px] py-[12px] relative rounded-[4px] shrink-0 w-[160px] hover:bg-gray-50 hover:border-[#999999] transition-colors cursor-pointer">
                <span className="font-['Helvetica_Neue:Regular', sans-serif] leading-[normal] not-italic relative shrink-0 text-[#595959] text-[14px] text-nowrap whitespace-pre">
                  Preview
                </span>
                <EyeIcon className="w-[18px] h-[18px] text-[#595959]" />
              </button>
              
              {/* Save Draft Button */}
              <button 
                onClick={onSaveDraft}
                className="bg-white border border-[#cccccc] border-solid box-border content-stretch flex gap-[8px] items-center justify-center max-w-[160px] overflow-visible px-[16px] py-[12px] relative rounded-[4px] shrink-0 w-[160px] hover:bg-gray-50 hover:border-[#999999] transition-colors cursor-pointer">
                <span className="font-['Helvetica_Neue:Regular', sans-serif] leading-[normal] not-italic relative shrink-0 text-[#595959] text-[14px] text-nowrap whitespace-pre">
                  Save Draft
                </span>
                <Save className="w-[14px] h-[14px] text-[#595959]" />
              </button>
              
              {/* Task Schedule Button */}
              <button 
                onClick={onTaskSchedule}
                className="bg-white border border-[#cccccc] border-solid box-border content-stretch flex gap-[7px] items-center justify-center max-w-[180px] overflow-visible px-[16px] py-[12px] relative rounded-[4px] shrink-0 w-[180px] hover:bg-gray-50 hover:border-[#999999] transition-colors cursor-pointer">
                <span className="font-['Helvetica_Neue:Regular', sans-serif] leading-[normal] not-italic relative shrink-0 text-[#595959] text-[14px] text-nowrap whitespace-pre">
                  Task Schedule
                </span>
                <Calendar className="w-[14px] h-[14px] text-[#595959]" />
              </button>
              
              {/* TaskLink Section (hidden for drafts / when showTaskLink=false) */}
              {showTaskLink && taskLink && (
                <div className="bg-white border border-[#cccccc] rounded-[4px] flex items-center justify-between gap-6 px-[16px] py-[8px] shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(e)}
                    className="font-['Helvetica_Neue:Regular', sans-serif] text-[14px] leading-[1.5] text-[#484de6] underline cursor-pointer whitespace-nowrap hover:text-[#2f35c4] transition-colors"
                    title="Copy task link"
                  >
                    TaskLink
                  </button>
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      title="Copy link"
                      className="w-5 h-5 text-[#999999] transition-all duration-200 cursor-pointer hover:text-[#484de6] hover:-translate-y-0.5 hover:scale-110 focus:-translate-y-0.5"
                      onClick={(e) => handleCopyLink(e)}
                    >
                      <CopyIcon className="w-full h-full" />
                    </button>
                    <button
                      type="button"
                      title="Share"
                      className="w-5 h-5 text-[#999999] transition-all duration-200 cursor-pointer hover:text-[#484de6] hover:-translate-y-0.5 hover:scale-110 focus:-translate-y-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator?.share) {
                          navigator
                            .share({ url: taskLink, title: 'Task Link' })
                            .catch(() => {});
                        } else {
                          window.open(taskLink, '_blank');
                        }
                      }}
                    >
                      <ShareIcon className="w-full h-full" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Close Task Button */}
              {onCloseTask && (
                <button 
                  onClick={onCloseTask}
                  className="bg-[#e5e7eb] border border-[#d1d5db] border-solid box-border content-stretch flex gap-[7px] items-center justify-center max-w-[160px] overflow-visible px-[16px] py-[12px] relative rounded-[4px] shrink-0 w-[160px] hover:bg-[#d1d5db] hover:border-[#9ca3af] transition-colors cursor-pointer">
                  <ClipboardCheck className="w-4 h-4 text-[#6b7280]" />
                  <span className="font-['Helvetica_Neue:Regular', sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6b7280] text-[14px] text-nowrap whitespace-pre">
                    Close Task
                  </span>
                </button>
              )}
            </>
          }
        />
      }
      leftContent={
        <div className="h-full relative">
          {/* TaskCreationForm - Takes remaining space */}
          <div className="absolute top-0 left-0 right-0 bottom-0 z-0 w-full">
            <TaskCreationForm
              key={formKey}
              data={taskFormData}
              onChange={onTaskFormChange}
            />
          </div>
          
          {/* Bottom Input Bar - Fixed at bottom */}
          <div className="absolute bottom-6 left-0 right-0 z-50 w-full">
            <BottomInputBar
              onPublish={() => onPublishTask(taskFormData)}
              onModify={onModifyTask}
              isLoading={modifyLoading}
              placeholder="Hens can modify it for you"
              publishLabel={publishLabel}
            />
          </div>
        </div>
      }
      rightContent={ hideSubmissionsPanel ? null : (
        <div className="h-full flex flex-col bg-[#F8F8F8]">
          {/* Title Section */}
          <div className="bg-[#f8f8f8] box-border content-stretch flex flex-col gap-[4px] items-start overflow-clip pb-[24px] pt-[16px] px-[16px] relative shrink-0 w-full">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#222222] text-[20px] tracking-[0.4px] w-full">
                  Submissions
                </p>
                <div className="content-stretch flex gap-[32px] items-center relative shrink-0 w-full">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                    <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#222222] text-[16px] text-nowrap tracking-[0.32px] whitespace-pre">
                      Assessment type Pass / Fail
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="box-border content-stretch flex gap-[8px] items-start px-[16px] py-0 relative shrink-0 w-full">
            <SummaryCard
              title="Total Submissions"
              value={totalSubmissions.toString()}
              bgColor="bg-[#f6f6fe]"
              borderColor="border-[#d2d3f9]"
              textColor="text-[#484de6]"
            />
            <SummaryCard
              title="Task Clarity"
              bgColor="bg-[#fffcf0]"
              borderColor="border-[#fde1b4]"
              textColor="text-[#f15a24]"
            >
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <StarRating rating={avgClarityScore ? Math.round(avgClarityScore) : 0} />
              </div>
            </SummaryCard>
            <SummaryCard
              title="Assessment Results"
              bgColor="bg-[#f0fff6]"
              borderColor="border-[#b2ffd1]"
              textColor="text-[#027a48]"
            >
              {renderAssessmentResults()}
            </SummaryCard>
          </div>
          
          {/* Content Area */}
          <div 
            ref={submissionsContainerRef}
            className="basis-0 box-border content-stretch flex flex-col gap-[24px] grow items-center min-h-px min-w-px overflow-hidden px-[16px] py-[24px] relative shrink-0 w-full"
          >
            <SubmissionsTable 
              submissions={paginatedSubmissions} 
              onSubmissionClick={handleSubmissionSelect}
            />
          </div>
          
          {/* Pagination */}
          <div className="box-border content-stretch flex h-[66px] items-center justify-center pb-0 pt-[20px] px-0 relative shrink-0 w-full -mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="w-full flex justify-center"
            />
          </div>
        </div>
      )}
    />
  );
}
