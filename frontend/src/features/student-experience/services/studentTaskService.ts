import type { EnrollPayload, StudentTask, SubmissionPayload } from '../types/studentTask';
import { parseResourceLink } from '@/shared/utils/resourceLinks';
import { getBackendUrl } from '@/lib/backendUrl';

const BACKEND_URL = getBackendUrl();

async function getToken(): Promise<string> {
  const r = await fetch('/api/auth/access-token', { credentials: 'include' });
  if (!r.ok) throw new Error('token error');
  const j: any = await r.json();
  return j.accessToken || j.token;
}

function parseAiFeedback(raw: any): { overall?: 'pass' | 'fail'; details: string[] } {
  const details: string[] = [];
  if (!raw) return { details };
  const pushCriteria = (criteria: any[]) => {
    for (const c of criteria) {
      const name = c?.name || 'Criterion';
      const level = c?.level || '';
      const comment = c?.comment || '';
      const improvement = c?.improvement || '';
      const segs = [`${name}: ${level}`];
      if (comment) segs.push(comment);
      if (improvement) segs.push(`Improvement: ${improvement}`);
      details.push(segs.join(' — '));
    }
  };

  const parseObject = (obj: any) => {
    const overall = typeof obj.overall === 'string'
      ? (obj.overall.toLowerCase() as 'pass' | 'fail')
      : undefined;
    if (typeof obj.summary === 'string' && obj.summary.trim()) {
      details.push(obj.summary.trim());
    }
    if (Array.isArray(obj.criteria)) {
      pushCriteria(obj.criteria);
    } else if (Array.isArray(obj.details)) {
      for (const d of obj.details) {
        if (typeof d === 'string' && d.trim()) details.push(d.trim());
      }
    }
    return overall;
  };

  try {
    if (typeof raw === 'object') {
      const overall = parseObject(raw);
      return { overall, details };
    }
    let txt = String(raw || '');
    const fence = txt.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fence && fence[1]) txt = fence[1];
    txt = txt.trim();
    if (!fence && !/^[\[{]/.test(txt)) {
      const first = txt.indexOf('{');
      const last = txt.lastIndexOf('}');
      if (first >= 0 && last > first) txt = txt.slice(first, last + 1);
    }
    const parsed = JSON.parse(txt);
    const overall = parseObject(parsed);
    return { overall, details };
  } catch {
    const fallback = String(raw || '').replace(/```/g, '').trim();
    if (fallback) details.push(fallback);
    return { details };
  }
}

function mapDbTaskToStudentTask(t: any): StudentTask {
  const dueIso = t.due_at ? new Date(t.due_at).toISOString() : null;
  const educatorName = (t.teacher_name || t.educator_name || '').toString().trim();
  const educatorAvatarUrl = t.teacher_picture || t.educator_picture || undefined;
  return {
    id: t.id,
    title: (t.task_title || '').toString(),
    status: 'not_started',
    dueDate: dueIso,
    dueAt: t.due_at || null, // Add dueAt for precise time calculations
    educatorName,
    educatorAvatarUrl,
    objective: (t.objective || '').toString(),
    instructions: [],
    submissionChecklist: [],
    duration: t.duration ? String(t.duration) : undefined,
    level: t.level ? String(t.level) : undefined,
    resources: [],
    academicIntegrity: (t.academic_integrity || '').toString().trim() || undefined,
    reflectionQuestions: [],
    assessmentCriteria: [],
    rubric: [],
    hints: [],
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
        // Map all fields exactly as they are in the database to ensure consistency
        base.instructions = Array.isArray(a.instructions) ? a.instructions : [];
        // expected_output → submission checklist if present
        base.submissionChecklist = Array.isArray(a.expected_output) ? a.expected_output : base.submissionChecklist;
        base.assessmentCriteria = Array.isArray(a.assessment_criteria) ? a.assessment_criteria : [];
        base.rubric = Array.isArray(a.rubric) ? a.rubric : [];
        base.objective = (a.objective || '').toString().trim() || base.objective;
        // Duration and level from database
        if (a.duration) base.duration = String(a.duration).trim();
        if (a.level_of_task) base.level = String(a.level_of_task).trim();
        // Resources: preserve exact format from database (strings like "Title - URL")
        if (Array.isArray(a.resources)) {
          base.resources = a.resources.map((r: any) => String(r || '').trim()).filter(Boolean);
          // Also parse resources into structured format for display
          base.resourceLinks = base.resources
            .map((r) => parseResourceLink(r))
            .filter((r): r is { title: string; url: string } => r !== null && r.href !== undefined)
            .map((r) => ({ title: r.title || r.href || '', url: r.href || '' }));
        }
        // Reflection questions
        if (Array.isArray(a.reflection_questions)) {
          base.reflectionQuestions = a.reflection_questions.map((q: any) => String(q || '').trim()).filter(Boolean);
        }
        // Support hints
        if (Array.isArray(a.support_hints)) {
          base.hints = a.support_hints.map((h: any) => String(h || '').trim()).filter(Boolean);
        }
        if (a.academic_integrity) {
          const integrity = String(a.academic_integrity || '').trim();
          base.academicIntegrity = integrity || base.academicIntegrity;
        }
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
        
        // Build summary with educator feedback if available
        const educatorFeedback = typeof mine.educator_feedback === 'string' && mine.educator_feedback.trim()
          ? mine.educator_feedback.trim()
          : undefined;
        const aiParsed = parseAiFeedback(mine.ai_feedback);
        const educatorStatus = typeof mine.educator_score === 'number'
          ? (mine.educator_score >= 60 ? 'passed' : 'failed')
          : undefined;
        const aiScoreStatus = typeof mine.ai_score === 'number'
          ? (mine.ai_score >= 60 ? 'passed' : 'failed')
          : undefined;
        const finalStatus = (educatorStatus || aiScoreStatus || aiParsed.overall || 'pending') as 'pass' | 'fail' | 'pending';

        base.summary = {
          clarityScore: typeof mine.clarity_score === 'number'
            ? Math.max(1, Math.min(5, Math.round(mine.clarity_score)))
            : (typeof mine.ai_score === 'number'
              ? Math.max(0, Math.min(5, Math.round(mine.ai_score / 20)))
              : base.summary?.clarityScore),
          feedback: {
            // Always use educator feedback from backend if available, don't fallback to old summary
            educatorFeedback: educatorFeedback,
            aiAssessment: aiParsed.details.length
              ? aiParsed.details
              : (base.summary?.feedback?.aiAssessment || []),
            status: finalStatus,
          },
        };
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
  const body = JSON.stringify({ passcode: payload.passcode?.trim() || null });
  const r = await fetch(`${BACKEND_URL}/api/enroll/${slug}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
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
  // Only send link assets here. File binaries must be uploaded via
  // POST /api/submissions/:id/assets/upload (see uploadSubmissionFile).
  for (const l of submission.links || []) {
    const url = (l.url || '').trim();
    if (url) assets.push({ asset_type: 'link', url });
  }
  const notes = (submission.notes || '').trim();

  // Create or return existing draft - backend returns submission_id
  const r = await fetch(`${BACKEND_URL}/api/submissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, assets, notes }),
  });
  if (!r.ok) throw new Error('failed to save submission');
  const j: any = await r.json();
  // submission_id is returned from backend - no need for localStorage
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] saveSubmission -> draft', {
      taskId,
      submissionId: j?.submission_id,
      assetsSent: assets.length,
      hasNotes: !!notes,
    });
  } catch {}

  // UI refresh happens via useStudentTasks.load()
  return undefined;
}

export async function submitFinal(taskId: string, clarityScore?: number | null) {
  const token = await getToken();
  // Fetch existing submission from backend instead of localStorage
  let submissionId: string | null = null;
  
  // Get existing submission from backend
  const existing = await fetchMySubmission(taskId);
  if (existing?.id) {
    submissionId = existing.id;
  } else {
    // Create new draft if none exists
    const r = await fetch(`${BACKEND_URL}/api/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId }),
    });
    if (!r.ok) throw new Error('failed to create draft before submit');
    const j: any = await r.json();
    submissionId = j?.submission_id || null;
  }

  if (!submissionId) throw new Error('no submission id');
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] submitFinal', { taskId, submissionId, clarityScore });
  } catch {}

  const rs = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clarity_score: clarityScore || null }),
  });
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] submitFinal -> response', { ok: rs.ok, status: rs.status });
  } catch {}
  if (!rs.ok) throw new Error('failed to submit');

  // Don't wait for full task reload - return immediately for faster UX
  // The task list will refresh naturally when needed
  return undefined; // Return undefined to indicate success without waiting for full reload
}

export async function uploadSubmissionFile(taskId: string, file: File): Promise<{ file_name: string }[]> {
  const token = await getToken();
  // Fetch existing submission from backend instead of localStorage
  let submissionId: string | null = null;
  
  // Get existing submission from backend
  const existing = await fetchMySubmission(taskId);
  if (existing?.id) {
    submissionId = existing.id;
  } else {
    // Create new draft if none exists
    const r = await fetch(`${BACKEND_URL}/api/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId })
    });
    if (!r.ok) throw new Error('failed to create draft for upload');
    const j: any = await r.json();
    submissionId = j?.submission_id || null;
  }
  if (!submissionId) throw new Error('no submission id');

  const form = new FormData();
  form.append('files', file);
  form.append('task_id', taskId); // Include task_id in case submission needs to be created
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] uploadSubmissionFile', { taskId, submissionId, name: file.name, size: file.size });
  } catch {}
  const r2 = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}/assets/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!r2.ok) {
    const errorText = await r2.text();
    let errorMsg = 'upload failed';
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  const j2: any = await r2.json();
  try {
    // eslint-disable-next-line no-console
    console.log('[studentTaskService] uploadSubmissionFile -> saved', { taskId, submissionId, saved: (Array.isArray(j2.assets) ? j2.assets.length : 0) });
  } catch {}
  // Return assets with submission ID for download links
  const assets = Array.isArray(j2.assets) ? j2.assets : [];
  return assets.map((asset: any) => ({ ...asset, submissionId }));
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

export interface AIAssessment {
  overall: 'pass' | 'fail' | null;
  overall_score: number | null;
  summary: string | null;
  what_went_well?: string | null; // New field for what went well (for both pass and fail)
  what_could_be_improved?: string | null; // New field for improvement suggestions (for both pass and fail)
  failure_reason: string | null;
  what_is_missing: string | null;
  how_to_pass: string | null;
  criteria: Array<{
    name: string;
    level: string;
    comment: string;
    improvement: string;
  }>;
  evidence_checked: string[];
}

export async function getAIAssessment(
  taskId: string,
  submission: { files: Array<{ name: string }>; links: Array<{ url: string }>; notes: string }
): Promise<AIAssessment> {
  const token = await getToken();
  const r = await fetch(`${BACKEND_URL}/api/submissions/ai/assess`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: taskId,
      submission: {
        links: submission.links.map(l => l.url).filter(Boolean),
        files: submission.files.map(f => f.name).filter(Boolean),
        notes: submission.notes || ''
      }
    })
  });
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(errorText || 'failed to get AI assessment');
  }
  const j = await r.json();
  if (!j?.ok) throw new Error(j?.error || 'AI assessment failed');
  return j.assessment;
}
