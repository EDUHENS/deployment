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
