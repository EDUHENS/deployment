export type SubmissionStatus = 'pending' | 'approved' | 'needs_revision';
export type AssessmentOutcome = 'pass' | 'fail';

export interface SubmissionAttachment {
  type: 'pdf' | 'github';
  name: string;
  size: string;
}

export interface AIAssessment {
  overall: AssessmentOutcome;
  details: string[];
}

export interface StudentSubmission {
  id: number;
  studentName: string;
  submissionDate: string;
  status: SubmissionStatus;
  aiAssessment: AIAssessment;
  attachments: SubmissionAttachment[];
  studentNote: string;
}

export interface EducatorSubmission {
  grade: AssessmentOutcome;
  feedback: string;
  submittedAt: Date;
}

export type ApprovedGradesMap = Record<number, boolean>;
export type EducatorSubmissionsMap = Record<number, EducatorSubmission>;

// TODO(db): Align submission and educator submission types with backend schema.
// - Confirm date/time formats (ISO strings vs Date)
// - Confirm allowed status values and assessment outcomes
