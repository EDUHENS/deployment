import React, { useState, useEffect } from 'react';
import { CircleX, CheckCircle, FileText, Github } from 'lucide-react';
import CloseButton from '@/shared/components/ui/CloseButton';
import type { SubmissionAttachment } from '@/features/educator-experience/types/submission';

// TODO(db): Wire approve and educator submission actions to backend.
// - Persist educatorGrade/feedback
// - Reflect approved state from server on reopen

interface SubmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproveGrade: (grade: 'pass' | 'fail', feedback?: string) => void;
  onEducatorSubmission?: (grade: string, feedback: string) => void;
  educatorSubmission?: {
    grade: string;
    feedback: string;
    submittedAt: Date;
  };
  isGradeApproved?: boolean;
  selectedSubmission?: {
    id: number;
    studentName: string;
    submissionDate: string;
    status?: string;
    aiAssessment: {
      overall: 'pass' | 'fail' | 'pending';
      details: string[];
    };
    attachments?: SubmissionAttachment[];
    studentNote?: string;
  } | null;
}

const SubmissionDetailsModal: React.FC<SubmissionDetailsModalProps> = ({
  isOpen,
  onClose,
  onApproveGrade,
  onEducatorSubmission,
  educatorSubmission,
  isGradeApproved = false,
  selectedSubmission
}) => {
  const [educatorGrade, setEducatorGrade] = useState<'pass' | 'fail' | null>(null);
  const [educatorFeedback, setEducatorFeedback] = useState('');
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || 'http://localhost:5001';

  async function getToken(): Promise<string> {
    const r = await fetch('/api/auth/access-token', { credentials: 'include' });
    if (!r.ok) throw new Error('token error');
    const j: any = await r.json();
    return j.accessToken || j.token;
  }

  async function handleDownload(href: string, filename: string) {
    try {
      const isBackend = href.startsWith(BACKEND_URL);
      if (!isBackend) {
        window.open(href, '_blank', 'noopener');
        return;
      }
      const token = await getToken();
      const resp = await fetch(href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('download failed');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error', e);
    }
  }

  // Initialize form state from existing submission
  useEffect(() => {
    if (educatorSubmission) {
      setEducatorGrade(educatorSubmission.grade as 'pass' | 'fail');
      setEducatorFeedback(educatorSubmission.feedback);
    } else {
      setEducatorGrade(null);
      setEducatorFeedback('');
    }
  }, [educatorSubmission]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[calc(100vh-4rem)] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Submission Details</h2>
          <CloseButton onClick={onClose} size="sm" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 min-h-0">
          {/* Student Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Student Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedSubmission?.studentName || 'Unknown Student'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Submission Date/Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedSubmission?.submissionDate || ''}
              </p>
            </div>
          </div>

          {/* Educator Assessment - Always Editable */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-6">Educator&rsquo;s Assessment</h3>
            <div className="space-y-6">
              {/* Grade Selection */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  {isGradeApproved && (
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
                          : 'border-gray-300 bg-white'
                      }`}>
                        {educatorGrade === 'pass' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">Pass</span>
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
                          : 'border-gray-300 bg-white'
                      }`}>
                        {educatorGrade === 'fail' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">Fail</span>
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
                  {isGradeApproved && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <textarea
                    value={educatorFeedback}
                    onChange={(e) => setEducatorFeedback(e.target.value)}
                    placeholder="Enter your feedback here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder:text-gray-400"
                    rows={4}
                    maxLength={500}
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
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-base font-semibold text-gray-900">Hens(AI) Assessment</h3>
              {selectedSubmission?.aiAssessment?.overall === 'pass' && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">Pass</span>
                </div>
              )}
              {selectedSubmission?.aiAssessment?.overall === 'fail' && (
                <div className="flex items-center gap-2">
                  <CircleX className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">Fail</span>
                </div>
              )}
              {selectedSubmission?.aiAssessment?.overall === 'pending' && (
                <div className="text-sm font-semibold text-gray-600">Pending</div>
              )}
            </div>
            {selectedSubmission?.aiAssessment?.overall === 'pending' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                Learner hasn’t submitted this task yet. No AI assessment is available.
              </div>
            ) : (
              <div className={`${selectedSubmission?.aiAssessment?.overall === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6 max-h-64 overflow-y-auto`}>
                <ul className="space-y-2 text-sm text-gray-700">
                  {(selectedSubmission?.aiAssessment?.details || []).length > 0 ? (
                    (selectedSubmission?.aiAssessment?.details || []).map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-600 font-medium">•</span>
                        <span>{line}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium">•</span>
                      <span>No details available.</span>
                    </li>
                  )}
                </ul>
                <div className="mt-3 text-sm text-gray-800">
                  <strong>Overall:</strong> {selectedSubmission?.aiAssessment?.overall}
                </div>
              </div>
            )}
          </div>

          {/* Student Note */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-6">Student Note</h3>
            {selectedSubmission?.aiAssessment?.overall === 'pending' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-sm text-gray-700">
                Learner hasn’t submitted task yet — no note or attachments available.
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-40 overflow-y-auto mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission?.studentNote || '—'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(selectedSubmission?.attachments || []).length === 0 ? (
                    <div className="text-gray-600 text-sm">No attachments</div>
                  ) : (
                    (selectedSubmission?.attachments || []).map((att, idx) => {
                      const isGithub = att.type === 'github';
                      const icon = isGithub ? <Github className="w-6 h-6 text-gray-600 mx-auto mb-3" /> : <FileText className="w-6 h-6 text-gray-600 mx-auto mb-3" />;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => att.href && handleDownload(att.href, att.name)}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
                        >
                          {icon}
                          <p className="text-sm font-medium text-gray-700 break-words">{att.name}</p>
                          {att.size ? <p className="text-xs text-gray-500">{att.size}</p> : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // If educator has provided input, use that; otherwise use Hens AI assessment
                const gradeToUse: 'pass' | 'fail' =
                  educatorGrade ??
                  (selectedSubmission?.aiAssessment?.overall === 'pending'
                    ? undefined
                    : (selectedSubmission?.aiAssessment?.overall as 'pass' | 'fail' | undefined)) ??
                  'pass';

                // Always call onEducatorSubmission if there's a grade, with trimmed feedback or empty string
                // The handler will convert empty strings to null
                if (educatorGrade) {
                  onEducatorSubmission?.(gradeToUse, educatorFeedback.trim() || '');
                }

                // Pass feedback to onApproveGrade so it can save it along with the grade
                onApproveGrade?.(gradeToUse, educatorFeedback.trim() || undefined);
              }}
              className="flex-1 px-6 py-4 text-base font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Approve Grade</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsModal;
