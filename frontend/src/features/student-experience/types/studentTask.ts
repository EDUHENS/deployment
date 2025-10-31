export type StudentTaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'saved'
  | 'submitted'
  | 'graded'
  | 'closed';

export interface StudentSubmissionLink {
  id: string;
  url: string;
}

export interface StudentSubmissionFile {
  id: string;
  name: string;
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
