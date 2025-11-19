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
  submissionId?: string; // submission id for download links
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface StudentSubmissionDraft {
  files: StudentSubmissionFile[];
  links: StudentSubmissionLink[];
  notes: string;
  updatedAt: string;
}

export interface StudentFeedback {
  educatorFeedback?: string;
  aiAssessment: string[];
  status: 'passed' | 'failed' | 'pending';
}

export interface StudentTaskSummary {
  clarityScore?: number;
  feedback?: StudentFeedback;
}

export interface StudentTask {
  id: string;
  title: string;
  status: StudentTaskStatus;
  dueDate: string | null;
  dueAt?: string | null; // Precise due date timestamp from database
  educatorName: string;
  educatorAvatarUrl?: string;
  objective: string;
  instructions: string[];
  submissionChecklist: string[];
  duration?: string; // Task duration from database
  level?: string; // Task level from database
  resources?: string[];
  resourceLinks?: { title: string; url: string }[]; // Parsed resource links
  reflectionQuestions?: string[]; // Reflection questions from database
  assessmentCriteria?: string[];
  rubric?: string[][];
  hints?: string[];
  academicIntegrity?: string;
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
