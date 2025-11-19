'use client';

import { CheckCircle2 } from 'lucide-react';
import CloseButton from './CloseButton';
import AIAssessmentBadge from './AIAssessmentBadge';
import AttachmentIcon from './AttachmentIcon';

interface SubmissionModalProps {
  submission: {
    id: number;
    studentName: string;
    submissionDate: string;
    status: 'pending' | 'approved' | 'needs_revision';
    aiAssessment: {
      overall: 'pass' | 'fail';
      details: string[];
    };
    attachments: {
      type: 'pdf' | 'github';
      name: string;
      size: string;
    }[];
    studentNote?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
}

export default function SubmissionModal({ 
  submission, 
  isOpen, 
  onClose, 
  onApprove 
}: SubmissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
            {submission.studentName}&rsquo;s Submission
            </h3>
            <p className="text-base text-gray-500">{submission.submissionDate}</p>
          </div>
          <CloseButton onClick={onClose} size="sm" />
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* AI Assessment */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">AI Assessment</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-medium">Overall Result:</span>
                  <AIAssessmentBadge result={submission.aiAssessment.overall} />
                </div>
                <ul className="space-y-2">
                  {submission.aiAssessment.details.map((detail, index) => (
                    <li key={index} className="text-base text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Student Note */}
            {submission.studentNote && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Student Note</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-base text-gray-700">{submission.studentNote}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
              <div className="grid grid-cols-2 gap-4">
                {submission.attachments.map((attachment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors">
                    <AttachmentIcon type={attachment.type} size="lg" />
                    <div>
                      <p className="font-medium text-gray-900">{attachment.name}</p>
                      <p className="text-base text-gray-500">{attachment.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve Submission
          </button>
        </div>
      </div>
    </div>
  );
}
