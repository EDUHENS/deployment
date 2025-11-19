import type { TaskFormData } from '../features/educator-experience/types';
import { getBackendUrl } from '@/lib/backendUrl';

export interface AITaskCreationRequest {
  ai_task_creation_guidelines: {
    purpose: string;
    rules: string[];
    task_structure: {
      title: string;
      objective: string;
      instructions: string;
      expected_output: string;
      duration: string;
      resources: string;
      reflection: string;
      assessment: {
        criteria: string[];
        grading_rubric: string;
      };
      level_of_task: string;
      support_and_hints: string;
    };
    default_behaviors: {
      if_teacher_input_is_missing: string;
      if_teacher_input_is_partial: string;
      if_teacher_input_is_conflicting: string;
    };
  };
  teacher_specification: string;
}

export interface AITaskCreationResponse {
  success: boolean;
  task?: {
    title: string;
    objective: string;
    instructions: string[];
    expected_output: string[];
    duration: string;
    resources: string[];
    reflection_questions: string[];
    assessment_criteria: string[];
    rubric: string[][];
    level_of_task: string;
    support_hints: string[];
    academic_integrity: string;
  };
  error?: string;
}

export function createAITaskRequest(teacherInput: string): AITaskCreationRequest {
  return {
    ai_task_creation_guidelines: {
      purpose: "Always generate rigorous, student-facing tasks suitable for bachelor, master, PhD, vocational, corporate training, or hobby learning. Teacher input is only a specification, not the final task. Expand into a full assignment with all necessary academic or practical elements.",
      rules: [
        "Never only rephrase teacher input; always expand into a comprehensive task.",
        "Tasks must include title, objective, detailed instructions, expected output, resources, reflection, assessment criteria, grading rubric, level of task, duration, and support.",
        "Default to higher education standards (Bloom's taxonomy) but adapt to vocational, hobby, or corporate training contexts.",
        "If teacher leaves fields blank, assume best-practice defaults.",
        "Respect academic and practical integrity: always remind learners to follow ethical practices (cite sources, show authentic work, etc.)."
      ],
      task_structure: {
        title: "Concise, informative, and topic-specific",
        objective: "Learning outcome in higher-order terms (analyze, evaluate, create, build, practice)",
        instructions: "Step-by-step numbered guidance for independent work",
        expected_output: "Unambiguous format of proof (essay, report, prototype, artwork, product, code, presentation, etc.)",
        duration: "Estimated completion time (hours/days/weeks)",
        resources: "Suggested readings, tools, or materials",
        reflection: "Critical reflection question(s)",
        assessment: {
          criteria: [
            "Relevance and completeness",
            "Depth of analysis or practice",
            "Clarity and rigor",
            "Originality and creativity"
          ],
          grading_rubric: "Percentage-based rubric or qualitative scale depending on context"
        },
        level_of_task: "Introductory / Intermediate / Advanced / Research",
        support_and_hints: "Scaffolding, examples, or hints to aid learning"
      },
      default_behaviors: {
        if_teacher_input_is_missing: "Auto-fill based on defaults and best practices",
        if_teacher_input_is_partial: "Respect input but enrich with missing elements",
        if_teacher_input_is_conflicting: "Ask up to 4 clarifying questions; otherwise assume defaults"
      }
    },
    teacher_specification: teacherInput
  };
}

export async function generateAITask(teacherInput: string): Promise<AITaskCreationResponse> {
  try {
    console.log('[AI] generateAITask called with prompt:', teacherInput);
    // Call backend route to generate (no persistence)
    const BACKEND_URL = getBackendUrl();
    console.log('[AI] Backend URL:', BACKEND_URL);

    // Get an access token via the Next route to authorize backend call
    const tokenRes = await fetch('/api/auth/access-token', { credentials: 'include' });
    if (!tokenRes.ok) throw new Error('Failed to obtain access token');
    const tokenJson: any = await tokenRes.json();
    const token: string = tokenJson.accessToken || tokenJson.token;
    console.log('[AI] Access token present:', Boolean(token));
    if (!token) throw new Error('No access token');

    // Build the exact request shape you provided
    const requestPayload = createAITaskRequest(teacherInput);
    console.log('[AI] Sending requestPayload keys:', Object.keys(requestPayload || {}));

    const res = await fetch(`${BACKEND_URL}/api/tasks/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // Pass the guidelines + teacher_specification exactly as required
      body: JSON.stringify(requestPayload),
    });
    console.log('[AI] Backend /generate status:', res.status, res.statusText);
    if (!res.ok) {
      const text = await res.text();
      console.error('[AI] Backend /generate error body:', text);
      throw new Error(text || 'AI generation failed');
    }
    const data = await res.json();
    console.log('[AI] Backend /generate payload ok?:', data?.ok);
    if (data?.debug) {
      console.log('[AI] Debug prompt:', data.debug.prompt);
      console.log('[AI] Debug raw content snippet:', (data.debug.raw || '').slice(0, 200));
    }
    if (!data?.ok) throw new Error(data?.error || 'AI generation failed');
    console.log('[AI] Generation task keys:', Object.keys(data.task || {}));
    console.log('[AI] Generation task preview:', JSON.stringify(data.task, null, 2).slice(0, 1000));
    return { success: true, task: data.task } as AITaskCreationResponse;
  } catch (error) {
    console.error('[AI] generateAITask failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

export function convertAITaskToFormData(aiTask: AITaskCreationResponse['task']): TaskFormData {
  if (!aiTask) {
    return {
      title: '',
      objective: '',
      steps: [''],
      expectedOutputs: [''],
      duration: '',
      resources: [''],
      reflectionQuestions: [''],
      assessmentCriteria: [''],
      rubric: [],
      levelOfTask: '',
      supportHints: [''],
      academicIntegrity: '',
      gradingSystem: 'passfail'
    };
  }

    // Normalize resources: accept strings or {title, url}
    const normalizedResources = Array.isArray(aiTask.resources)
      ? aiTask.resources.map((r: any) => {
          if (typeof r === 'string') return r;
          if (r && typeof r.title === 'string' && typeof r.url === 'string') return `${r.title} - ${r.url}`;
          return JSON.stringify(r);
        })
      : [];

  // Normalize rubric to ensure header + rows aligned with criteria
  const criteria = Array.isArray(aiTask.assessment_criteria) ? aiTask.assessment_criteria : [];
  let rubric2D: string[][] = Array.isArray(aiTask.rubric) ? aiTask.rubric : [];
  const header = ['Criteria','Excellent','Good (75–89%)','Satisfactory (60–74%)','Needs Improvement (<60%)'];
  const is2D = Array.isArray(rubric2D) && rubric2D.every((row) => Array.isArray(row));
  if (!is2D || rubric2D.length === 0) {
    rubric2D = [header, ...criteria.map((c) => [c, '—', '—', '—', '—'])];
  } else {
    // enforce 5 columns and criterion in first cell
    const dataRows = rubric2D.slice(1);
    rubric2D[0] = header;
    if (criteria.length && dataRows.length !== criteria.length) {
      rubric2D = [header, ...criteria.map((c) => [c, '—', '—', '—', '—'])];
    } else {
      rubric2D = [header, ...dataRows.map((row, i) => {
        const r = Array.isArray(row) ? row.slice(0, 5) : [];
        while (r.length < 5) r.push('—');
        if (criteria[i]) r[0] = criteria[i];
        return r;
      })];
    }
  }

  return {
    title: aiTask.title,
    objective: aiTask.objective,
    steps: aiTask.instructions,
    expectedOutputs: aiTask.expected_output,
    duration: aiTask.duration,
    resources: normalizedResources,
    reflectionQuestions: aiTask.reflection_questions,
    assessmentCriteria: criteria,
    rubric: rubric2D,
    levelOfTask: aiTask.level_of_task,
    supportHints: aiTask.support_hints,
    academicIntegrity: aiTask.academic_integrity,
    gradingSystem: 'passfail'
  };
}

// Convert UI form data back to ai_task payload shape for backend
export function convertFormDataToAiTask(form: TaskFormData) {
  return {
    title: form.title,
    objective: form.objective,
    instructions: form.steps,
    expected_output: form.expectedOutputs,
    duration: form.duration,
    resources: form.resources,
    reflection_questions: form.reflectionQuestions,
    assessment_criteria: form.assessmentCriteria,
    rubric: form.rubric,
    level_of_task: form.levelOfTask,
    support_hints: form.supportHints,
    academic_integrity: form.academicIntegrity,
  };
}
