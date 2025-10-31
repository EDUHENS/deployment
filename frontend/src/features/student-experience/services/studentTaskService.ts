import { mockStudentTasks } from '../../../mocks/data/student/tasks';
import type {
  EnrollPayload,
  StudentTask,
  SubmissionPayload,
} from '../types/studentTask';

let studentTasks = [...mockStudentTasks];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchEnrolledTasks(): Promise<StudentTask[]> {
  await delay(200);
  return [...studentTasks];
}

export async function enrollTask(payload: EnrollPayload): Promise<StudentTask> {
  await delay(400);
  const newTask: StudentTask = {
    id: `task-${Date.now()}`,
    title: `Enrolled task (${payload.link})`,
    status: 'not_started',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    educatorName: 'Educator',
    objective: 'This task was provided by your educator.',
    instructions: [
      'Review the educator materials in the LMS.',
      'Complete the required deliverables described in the brief.',
      'Submit your work before the deadline.',
    ],
    submissionChecklist: ['Submission file(s).', 'Supporting link(s).', 'Reflection notes.'],
    submission: {
      files: [],
      links: [],
      notes: '',
      updatedAt: new Date().toISOString(),
    },
  };
  studentTasks = [newTask, ...studentTasks];
  return newTask;
}

export async function fetchTaskDetails(taskId: string): Promise<StudentTask | undefined> {
  await delay(200);
  return studentTasks.find((task) => task.id === taskId);
}

export async function saveSubmission(taskId: string, submission: SubmissionPayload) {
  await delay(300);
  studentTasks = studentTasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: task.status === 'submitted' ? 'submitted' : 'saved',
          submission: {
            files: submission.files,
            links: submission.links,
            notes: submission.notes,
            updatedAt: new Date().toISOString(),
          },
        }
      : task,
  );
  return studentTasks.find((task) => task.id === taskId);
}

export async function submitFinal(taskId: string) {
  await delay(400);
  studentTasks = studentTasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: 'submitted',
          submission: {
            ...(task.submission ?? {
              files: [],
              links: [],
              notes: '',
              updatedAt: new Date().toISOString(),
            }),
            updatedAt: new Date().toISOString(),
          },
        }
      : task,
  );
  return studentTasks.find((task) => task.id === taskId);
}

export function resetStudentTasks() {
  studentTasks = [...mockStudentTasks];
}
