'use client';

import { User, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';
import AIAssessmentBadge from './AIAssessmentBadge';
import AttachmentIcon from './AttachmentIcon';

interface SubmissionCardProps {
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
  onClick: () => void;
  className?: string;
}

export default function SubmissionCard({ submission, onClick, className = '' }: SubmissionCardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Header with student info and status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{submission.studentName}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {submission.submissionDate}
            </p>
          </div>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      {/* AI Assessment */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">AI Assessment:</span>
          <AIAssessmentBadge result={submission.aiAssessment.overall} />
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          {submission.aiAssessment.details[0]}
        </p>
      </div>

      {/* Attachments */}
      <div className="flex gap-2 mb-3">
        {submission.attachments.map((attachment, index) => (
          <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
            <AttachmentIcon type={attachment.type} size="sm" />
            <span>{attachment.name}</span>
          </div>
        ))}
      </div>

      {/* Student Note Preview */}
      {submission.studentNote && (
        <div className="bg-gray-50 rounded p-2">
          <p className="text-sm text-gray-600 line-clamp-2">
            &ldquo;{submission.studentNote}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
