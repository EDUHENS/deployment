export type GradingSystem = 'passfail';

export interface TaskFormData {
  title: string;
  objective: string;
  steps: string[];
  expectedOutputs: string[];
  duration: string;
  resources: string[];
  reflectionQuestions: string[];
  assessmentCriteria: string[];
  rubric: string[][];
  levelOfTask: string;
  supportHints: string[];
  academicIntegrity: string;
  gradingSystem: GradingSystem;
}

export interface Task {
  id: number;
  title: string;
  dueDate: number;
  submissions?: number;
  timeLeft?: string;
  clarityScore?: number;
  isDraft?: boolean;
  formData?: TaskFormData;
}

// TODO(db): Ensure this type matches backend schema exactly.
// - Decide if formData is embedded (JSON) or fetched via a separate endpoint
// - Align field names (snake_case vs camelCase) and required/optional flags
