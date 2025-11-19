'use client';

import { useState } from 'react';
import { Star, FileText, CheckCircle, XCircle } from 'lucide-react';
import CloseButton from '@/shared/components/ui/CloseButton';

interface EducatorSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitGrade?: (grade: number | string, feedback: string) => void;
  studentName?: string;
  submissionDate?: string | null;
}

export default function EducatorSubmissionModal({ 
  isOpen, 
  onClose,
  onSubmitGrade,
  studentName,
  submissionDate
}: EducatorSubmissionModalProps) {
  const [grade, setGrade] = useState<number | string>(0);
  const [feedback, setFeedback] = useState('');
  const formattedSubmissionDate = submissionDate
    ? new Date(submissionDate).toLocaleString()
    : 'Not submitted yet';

  // Determine grading system based on task data
  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmitGrade?.(grade, feedback);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-60 p-8">
      <div className="bg-[#f8f8f8] border-4 border-[#cccccc] border-solid relative rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <CloseButton onClick={onClose} className="absolute right-4 top-4 z-10" size="md" />

        {/* Scrollable Content */}
        <div className="flex flex-col gap-6 items-start p-8 overflow-y-auto scrollbar-thin">
          {/* Title */}
          <div className="w-full">
            <h2 className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[24px] tracking-[0.48px] text-center">
              Educator Submission
            </h2>
          </div>

          {/* Student Info */}
          <div className="flex gap-4 items-start w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
                Student Name
              </p>
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px]">
                {studentName || 'Unknown Student'}
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
                Submission Date
              </p>
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px]">
                {formattedSubmissionDate}
              </p>
            </div>
          </div>

          {/* Grade Section */}
          <div className="flex flex-col gap-4 w-full">
            <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
              Grade (Pass/Fail)
            </p>
            
            {/* Pass/Fail grading */}
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setGrade('pass')}
                className={`flex gap-2 items-center px-4 py-2 rounded-[4px] border transition-colors ${
                  grade === 'pass' 
                    ? 'bg-green-100 border-green-500 text-green-700' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-green-50'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[16px]">Pass</span>
              </button>
              <button
                onClick={() => setGrade('fail')}
                className={`flex gap-2 items-center px-4 py-2 rounded-[4px] border transition-colors ${
                  grade === 'fail' 
                    ? 'bg-red-100 border-red-500 text-red-700' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-red-50'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[16px]">Fail</span>
              </button>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="flex flex-col gap-4 w-full">
            <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
              Educator Feedback
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback for the student..."
              className="bg-white border border-[#d5d7da] border-solid box-border flex flex-col gap-4 p-4 rounded-[8px] w-full h-32 resize-none focus:outline-none focus:border-[#484de6] transition-colors"
            />
          </div>

          {/* Attachments Section */}
          <div className="flex flex-col gap-4 w-full">
            <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[16px] tracking-[0.32px]">
              Attachments (Optional)
            </p>
            <div className="flex gap-4 items-center">
              <button className="bg-white border border-[#d5d7da] border-solid box-border flex flex-col gap-2 items-center justify-center px-4 py-3 rounded-[8px] cursor-pointer hover:bg-gray-50 transition-colors">
                <FileText className="w-6 h-6 text-[#414651]" />
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#414651] text-[14px] tracking-[0.28px]">
                  Upload File
                </p>
              </button>
              <div className="flex-1">
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#717680] text-[14px] tracking-[0.28px]">
                  Upload additional files, images, or documents to support your feedback
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 items-start w-full mt-4">
            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="bg-[#fdfdfd] border border-[#e9eaeb] border-solid box-border flex items-center justify-center flex-1 py-4 rounded-[4px] cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors"
            >
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#414651] text-[20px] tracking-[0.4px]">
                Cancel
              </p>
            </button>

            {/* Submit Grade Button */}
            <button
              onClick={handleSubmit}
              disabled={
                !grade || 
                feedback.trim() === ''
              }
              className="bg-[#444ce7] border-[#444ce7] border-solid box-border flex gap-2 items-center justify-center flex-1 py-4 rounded-[4px] cursor-pointer hover:bg-[#3A3FE4] transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
            >
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-white text-[20px] tracking-[0.4px]">
                Submit Grade
              </p>
              <Star className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
