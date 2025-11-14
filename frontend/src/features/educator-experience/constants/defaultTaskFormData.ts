import type { TaskFormData } from '@/features/educator-experience/types';

export const defaultTaskFormData: TaskFormData = {
  title: '',
  objective: '',
  steps: [],
  expectedOutputs: [],
  duration: '',
  resources: [],
  reflectionQuestions: [],
  assessmentCriteria: [],
  rubric: [],
  levelOfTask: '',
  supportHints: [],
  academicIntegrity: '',
  gradingSystem: 'passfail',
};

