// src/services/taskApi.ts
import { getBackendUrl } from '@/lib/backendUrl';

const BACKEND_URL = getBackendUrl();

async function getToken(): Promise<string> {
  const r = await fetch('/api/auth/access-token', { credentials: 'include' });
  if (!r.ok) throw new Error('token error');
  const j: any = await r.json();
  return j.accessToken || j.token;
}

export type AiTaskPayload = {
  title: string;
  objective: string;
  instructions: string[];
  expected_output: string[];
  duration: string;
  resources: any[];
  reflection_questions: string[];
  assessment_criteria: string[];
  rubric: string[][];
  level_of_task: string;
  support_hints: string[];
  academic_integrity: string;
};

export async function createDraft(params: {
  ai_task: AiTaskPayload;
  ai_guidelines?: any;
  opens_at?: string | null;
  due_at?: string | null;
  study_link?: string | null;
  access_code?: string | null;
}): Promise<{ ok: boolean; task_id?: string } & any> {
  const token = await getToken();
  console.log('[createDraft] Calling backend with token present:', Boolean(token));
  const r = await fetch(`${BACKEND_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  console.log('[createDraft] Backend response status:', r.status, r.statusText);
  if (!r.ok) {
    const errorText = await r.text();
    console.error('[createDraft] Backend error:', errorText);
    try {
      const errorJson = JSON.parse(errorText);
      return errorJson;
    } catch {
      return { ok: false, error: errorText || 'Failed to create draft' };
    }
  }
  const result = await r.json();
  console.log('[createDraft] Backend response:', result);
  return result;
}

export async function replaceSections(taskId: string, ai_task: AiTaskPayload) {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/sections`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ai_task }),
  });
  return r.json();
}

export async function updateTaskMain(taskId: string, fields: any) {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(fields),
  });
  return r.json();
}

export async function publishTask(taskId: string) {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'published' }),
  });
  return r.json();
}

export async function closeTask(taskId: string) {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'archived' }),
  });
  return r.json();
}

export type TaskListItem = {
  id: string;
  task_title: string;
  status: 'draft' | 'published' | 'archived';
  opens_at: string | null;
  due_at: string | null;
  published_at?: string | null;
  share_enabled?: boolean;
  share_slug?: string | null;
  updated_at?: string;
  link?: string | null;
  submission_count?: number;
  avg_clarity_score?: number | null;
};

export async function listTasks(): Promise<{ ok: boolean; tasks: TaskListItem[] }> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

export async function getTaskForm(taskId: string): Promise<{ ok: boolean; task: any; ai_task: any }> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/form`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

export async function getTaskEnrollments(taskId: string): Promise<{ ok: boolean; enrollments: Array<{ user_id: string; name?: string; email?: string; picture?: string; enrolled_at: string }> }> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/enrollments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

export async function getTaskSubmissions(taskId: string): Promise<{ ok: boolean; submissions: any[]; avg_clarity_score?: number | null }> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

export async function gradeSubmission(submissionId: string, payload: { educator_score?: number; educator_feedback?: string; status?: string }) {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}/grade`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return r.json();
}
