export type StudentTaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'saved'
  | 'submitted'
  | 'graded'
  | 'closed';

export interface StudentSubmissionLink {
  id: string;            // UI id
  url: string;
  assetId?: string;      // server asset id (for deletion)
}

export interface StudentSubmissionFile {
  id: string;            // UI id
  name: string;
  assetId?: string;      // server asset id (for deletion)
}

export interface StudentSubmissionDraft {
  files: StudentSubmissionFile[];
  links: StudentSubmissionLink[];
  notes: string;
  updatedAt: string;
}

export interface StudentFeedback {
  educatorFeedback: string;
  aiAssessment: string[];
  status: 'passed' | 'failed';
}

export interface StudentTaskSummary {
  clarityScore?: number;
  feedback?: StudentFeedback;
}

export interface StudentTask {
  id: string;
  title: string;
  status: StudentTaskStatus;
  dueDate: string;
  educatorName: string;
  objective: string;
  instructions: string[];
  submissionChecklist: string[];
  assessmentCriteria?: string[];
  rubric?: string[][];
  hints?: string[];
  submission?: StudentSubmissionDraft;
  summary?: StudentTaskSummary;
}

export interface EnrollPayload {
  link: string;
  passcode: string;
}

export interface SubmissionPayload {
  notes: string;
  files: StudentSubmissionFile[];
  links: StudentSubmissionLink[];
}
