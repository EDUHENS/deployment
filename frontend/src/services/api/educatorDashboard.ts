/**
 * TODO LIST:
 * After db implemenate 
 * TODO(db): 把 fetchDashboardBootstrap、generateTaskWithAI 換成實際 API；定義與後端對應的 URL 與型別
 */
import type {
  Task,
  TaskFormData,
  StudentSubmission,
  EducatorSubmissionsMap,
  ApprovedGradesMap
} from '../../features/educator-experience/types';
import { mockTasks, defaultTaskFormData } from '../../mocks/data/tasks';
import { buildMockSubmissions } from '../../mocks/data/submissions';

const NETWORK_DELAY = 300;

export interface DashboardBootstrapPayload {
  tasks: Task[];
  submissions: StudentSubmission[];
  defaultTaskForm: TaskFormData;
  educatorSubmissions: EducatorSubmissionsMap;
  approvedGrades: ApprovedGradesMap;
}

export const fetchDashboardBootstrap = async (): Promise<DashboardBootstrapPayload> => {
  const submissions = buildMockSubmissions();
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        tasks: mockTasks,
        submissions,
        defaultTaskForm: defaultTaskFormData,
        educatorSubmissions: {},
        approvedGrades: {}
      });
    }, NETWORK_DELAY);
  });
};

export const generateTaskWithAI = async (prompt: string): Promise<TaskFormData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...defaultTaskFormData,
        title: `${prompt} (AI Suggested)`,
        objective: `Auto-generated objective for: ${prompt}`,
        steps: [
          'Review learning objectives provided in the prompt',
          'Draft a scaffolded task outline with milestones',
          'Propose assessment metrics aligned with the objectives'
        ]
      });
    }, NETWORK_DELAY * 10); // Simulate longer AI operation
  });
};
