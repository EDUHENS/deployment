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

async function fetchMySubmission(taskId: string): Promise<any | null> {
  const token = await getToken();
  const url = `${BACKEND_URL}/api/submissions/mine?task_id=${encodeURIComponent(taskId)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!r.ok) return null;
  const j = await r.json();
  try {
    const sub = j?.submission;
    // eslint-disable-next-line no-console
    console.debug('[studentTaskService] /submissions/mine', {
      taskId,
      id: sub?.id,
      status: sub?.status,
      assets: Array.isArray(sub?.assets) ? sub.assets.length : 0,
    });
  } catch {}
  return j?.submission || null;
}

export async function fetchEnrolledTasks(): Promise<StudentTask[]> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/enroll/mine`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
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

    // Try attach existing draft/submission for this task
    try {
      const mine = await fetchMySubmission(t.id);
      if (mine) {
        const files = (mine.assets || [])
          .filter((x: any) => !x.url && x.file_name)
          .map((x: any) => ({ id: crypto.randomUUID(), name: String(x.file_name), assetId: String(x.id || '') || undefined }));
        const links = (mine.assets || [])
          .filter((x: any) => x.url)
          .map((x: any) => ({ id: crypto.randomUUID(), url: String(x.url), assetId: String(x.id || '') || undefined }));
        base.submission = {
          files,
          links,
          notes: String(mine.notes || ''),
          updatedAt: new Date(mine.updated_at || Date.now()).toISOString(),
        };
        try {
          // eslint-disable-next-line no-console
          console.log('[studentTaskService] mapped submission', {
            taskId: t.id,
            subId: mine.id,
            status: mine.status,
            files: files.length,
            links: links.length,
          });
        } catch {}
        // Reflect status for UI
        const st = String(mine.status || '').toLowerCase();
        if (st === 'draft') base.status = 'saved';
        else if (st === 'submitted') base.status = 'submitted';
        else if (st === 'graded') base.status = 'graded';
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

export async function getLatestSubmission(taskId: string) {
  return fetchMySubmission(taskId);
}

export async function saveSubmission(taskId: string, submission: SubmissionPayload) {
  const token = await getToken();
  // Map UI payload to backend assets
  const assets: any[] = [];
  for (const l of submission.links || []) {
    const url = (l.url || '').trim();
    if (url) assets.push({ asset_type: 'link', url });
  }
  for (const f of submission.files || []) {
    const name = (f.name || '').trim();
    if (name) assets.push({ asset_type: 'file', file_name: name });
  }
  const notes = (submission.notes || '').trim();

  // Create or return existing draft
  const r = await fetch(`${BACKEND_URL}/api/submissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, assets, notes }),
  });
  if (!r.ok) throw new Error('failed to save submission');
  const j: any = await r.json();
  const submissionId = j?.submission_id;
  try { if (submissionId) localStorage.setItem(`submission:${taskId}`, submissionId); } catch {}
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] saveSubmission -> draft', {
      taskId,
      submissionId,
      assetsSent: assets.length,
      hasNotes: !!notes,
    });
  } catch {}

  // Also update draft with any additional assets later if needed (PUT)
  // For now, return minimal echo so UI can continue; hook will refresh tasks
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
  const token = await getToken();
  // Find existing draft id; if missing, create one quickly (no assets)
  let submissionId: string | null = null;
  try { submissionId = localStorage.getItem(`submission:${taskId}`); } catch {}

  if (!submissionId) {
    const r = await fetch(`${BACKEND_URL}/api/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId }),
    });
    if (!r.ok) throw new Error('failed to create draft before submit');
    const j: any = await r.json();
    submissionId = j?.submission_id || null;
    try { if (submissionId) localStorage.setItem(`submission:${taskId}`, submissionId); } catch {}
  }

  if (!submissionId) throw new Error('no submission id');
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] submitFinal', { taskId, submissionId });
  } catch {}

  const rs = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] submitFinal -> response', { ok: rs.ok, status: rs.status });
  } catch {}
  if (!rs.ok) throw new Error('failed to submit');

  const tasks = await fetchEnrolledTasks();
  return tasks.find((t) => t.id === taskId);
}

export async function uploadSubmissionFile(taskId: string, file: File): Promise<{ file_name: string }[]> {
  const token = await getToken();
  // Ensure we have a draft and submission id
  let submissionId: string | null = null;
  try { submissionId = localStorage.getItem(`submission:${taskId}`); } catch {}
  if (!submissionId) {
    const r = await fetch(`${BACKEND_URL}/api/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId })
    });
    if (!r.ok) throw new Error('failed to create draft for upload');
    const j: any = await r.json();
    submissionId = j?.submission_id || null;
    try { if (submissionId) localStorage.setItem(`submission:${taskId}`, submissionId); } catch {}
  }
  if (!submissionId) throw new Error('no submission id');

  const form = new FormData();
  form.append('files', file);
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] uploadSubmissionFile', { taskId, submissionId, name: file.name, size: file.size });
  } catch {}
  const r2 = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}/assets/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!r2.ok) throw new Error('upload failed');
  const j2: any = await r2.json();
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] uploadSubmissionFile -> saved', { taskId, submissionId, saved: (Array.isArray(j2.assets) ? j2.assets.length : 0) });
  } catch {}
  return (Array.isArray(j2.assets) ? j2.assets : []) as any;
}

export async function deleteSubmissionAsset(taskId: string, assetId: string): Promise<boolean> {
  const token = await getToken();
  let submissionId: string | null = null;
  try { submissionId = localStorage.getItem(`submission:${taskId}`); } catch {}
  if (!submissionId) {
    const latest = await fetchMySubmission(taskId);
    submissionId = latest?.id || null;
    try { if (submissionId) localStorage.setItem(`submission:${taskId}`, submissionId); } catch {}
  }
  if (!submissionId) return false;
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] deleteSubmissionAsset', { taskId, submissionId, assetId });
  } catch {}
  const r = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}/assets/${assetId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] deleteSubmissionAsset -> response', { ok: r.ok, status: r.status });
  } catch {}
  return r.ok;
}

export function resetStudentTasks() {
  // no-op when using backend
}

export async function askForHints(taskId: string, question: string): Promise<{ hints: string[]; next_steps?: string[]; pinpointed_issues?: string[] }> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/tasks/ai/${encodeURIComponent(taskId)}/hints`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!r.ok) throw new Error('failed to get hints');
  const j = await r.json();
  return { hints: j.hints || [], next_steps: j.next_steps || [], pinpointed_issues: j.pinpointed_issues || [] };
}
