import type { EnrollPayload, StudentTask, SubmissionPayload } from '../types/studentTask';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

async function getToken(): Promise<string> {
  const r = await fetch('/auth/access-token', { credentials: 'include' });
  if (!r.ok) throw new Error('token error');
  const j: any = await r.json();
  return j.accessToken || j.token;
}

function mapDbTaskToStudentTask(t: any): StudentTask {
  const dueIso = t.due_at ? new Date(t.due_at).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: t.id,
    title: t.task_title || 'Task',
    status: 'not_started',
    dueDate: dueIso,
    educatorName: 'Your educator',
    objective: t.objective || '',
    instructions: [],
    submissionChecklist: ['Files', 'Links', 'Reflection notes'],
    submission: {
      files: [],
      links: [],
      notes: '',
      updatedAt: new Date().toISOString(),
    },
  };
}

async function fetchTaskForm(taskId: string): Promise<{ ai_task?: any }> {
  const token = await getToken();
  // Use student-facing form endpoint (checks enrollment)
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/form-student`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return {} as any;
  return r.json();
}

export async function fetchEnrolledTasks(): Promise<StudentTask[]> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/enroll/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('failed to load enrolled tasks');
  const j = await r.json();
  const rows = Array.isArray(j.tasks) ? j.tasks : [];
  // Enrich with task form (instructions, criteria, rubric)
  const tasks: StudentTask[] = [];
  for (const t of rows) {
    const base = mapDbTaskToStudentTask(t);
    try {
      const f = await fetchTaskForm(t.id);
      const a = f?.ai_task;
      if (a) {
        base.instructions = Array.isArray(a.instructions) ? a.instructions : [];
        // expected_output → submission checklist if present
        base.submissionChecklist = Array.isArray(a.expected_output) ? a.expected_output : base.submissionChecklist;
        base.assessmentCriteria = Array.isArray(a.assessment_criteria) ? a.assessment_criteria : [];
        base.rubric = Array.isArray(a.rubric) ? a.rubric : [];
        base.objective = a.objective || base.objective;
        // optional: hints/support
        if (Array.isArray(a.support_hints)) base.hints = a.support_hints;
      }
    } catch {}
    tasks.push(base);
  }
  return tasks;
}

export async function enrollTask(payload: EnrollPayload): Promise<StudentTask> {
  // Accept full link or just slug/code
  const input = (payload.link || '').trim();
  let slug = input;
  const idx = input.indexOf('/t/');
  if (idx >= 0) slug = input.slice(idx + 3).split(/[?#]/)[0];
  slug = slug.replace(/^\//, '');
  if (!slug) throw new Error('invalid link');

  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/enroll/${slug}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || 'enroll failed');
  }
  // After enrollment, fetch mine to reflect DB state
  const tasks = await fetchEnrolledTasks();
  // Return the newly enrolled task if present; else a fallback created from response
  try {
    const j = await r.json();
    const found = tasks.find((t) => t.id === j?.task?.id);
    if (found) return found;
  } catch {}
  return tasks[0];
}

export async function fetchTaskDetails(taskId: string): Promise<StudentTask | undefined> {
  const tasks = await fetchEnrolledTasks();
  return tasks.find((t) => t.id === taskId);
}

export async function saveSubmission(taskId: string, submission: SubmissionPayload) {
  // TODO: wire to backend /api/submissions (draft save). For now, no-op and return local reflection.
  return {
    id: taskId,
    title: '',
    status: 'saved' as const,
    dueDate: new Date().toISOString(),
    educatorName: 'Your educator',
    objective: '',
    instructions: [],
    submissionChecklist: [],
    submission: {
      files: submission.files,
      links: submission.links,
      notes: submission.notes,
      updatedAt: new Date().toISOString(),
    },
  } as StudentTask;
}

export async function submitFinal(taskId: string) {
  // TODO: POST /api/submissions/:id/submit
  const tasks = await fetchEnrolledTasks();
  return tasks.find((t) => t.id === taskId);
}

export function resetStudentTasks() {
  // no-op when using backend
}
