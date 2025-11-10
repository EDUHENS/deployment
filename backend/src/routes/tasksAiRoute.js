// backend/src/routes/tasksAiRoute.js
const express = require('express');
const { pool, userModel } = require('../database/index.js');

module.exports = (requireAuth) => {
  const router = express.Router();

  // POST /api/tasks/ai/generate
  // Body: { prompt: string, guidelines?: object, model?: string }
  // Returns: { ok: true, task: { ...structured fields... } } — does NOT persist to DB
  router.post('/generate', requireAuth, async (req, res) => {
    try {
      const body = req.body || {};
      // Accept either old shape { prompt, guidelines } or the exact provided shape
      const providedGuidelines = body.ai_task_creation_guidelines;
      const providedSpec = body.teacher_specification;
      const { prompt, guidelines, model } = body;
      const effectiveSpec = typeof providedSpec === 'string' ? providedSpec : prompt;
      const effectiveGuidelines = providedGuidelines || guidelines;
      const sub = req?.auth?.payload?.sub;
      console.log('[AI][POST /generate] sub:', sub, 'model:', model || 'gpt-4o-mini');
      console.log('[AI][POST /generate] teacher_specification present:', Boolean(effectiveSpec));
      // Pretty-print the exact input JSON you provided (as-is)
      try {
        const prettyInput = {
          ai_task_creation_guidelines: providedGuidelines,
          teacher_specification: effectiveSpec,
        };
        console.log('[AI][Input] === ai_task_creation request (as provided) ===\n' + JSON.stringify(prettyInput, null, 2));
      } catch (_) {}
      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      if (!apiKey) {
        console.error('[AI] Missing OPENAI_API_KEY');
        return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY is not configured' });
      }
      if (!effectiveSpec || typeof effectiveSpec !== 'string' || !effectiveSpec.trim()) {
        return res.status(400).json({ ok: false, error: 'Missing teacher_specification / prompt' });
      }

      const usedModel = model || 'gpt-4o-mini';

      // Build a compact system + user message pair, asking for strict JSON
      // The JSON schema matches the AITaskCreationResponse.task shape used on the frontend
      const system = `You are an instructional design assistant.
Output ONE JSON object ONLY (no prose/markdown). Keep JSON KEYS in English exactly:
title, objective, instructions, expected_output, duration, resources, reflection_questions, assessment_criteria, rubric, level_of_task, support_hints, academic_integrity.
All TEXT VALUES must be written in exactly the same language as teacher_specification (do not translate or mix languages).

Definitions (shape only; do not add extra keys):
- title: string
- objective: string
- instructions: string[]
- expected_output: string[]
- duration: string
- resources: string[]
- reflection_questions: string[]
- assessment_criteria: string[]
- rubric: string[][]
- level_of_task: string
- support_hints: string[]
- academic_integrity: string
`;

      // Pass through client's guidelines, but append rubric/resources constraints as requested
      const mergedGuidelines = { ...(providedGuidelines || {}) };
      const baseRules = Array.isArray(mergedGuidelines.rules) ? [...mergedGuidelines.rules] : [];
      baseRules.push(
        "assessment.rubric must include a header row and data rows that align with assessment.criteria; keys remain as in output schema.",
        "Rubric header should be: ['Criteria','Excellent','Good (75–89%)','Satisfactory (60–74%)','Needs Improvement (<60%)']. Each data row has exactly 5 cells: first cell = the corresponding criterion name; remaining 4 cells are non-empty, observable descriptors.",
        "resources must include publicly accessible URLs. Prefer items as {title, url} or, alternatively, a single string 'Title - URL'. Avoid private/personal data."
      );
      mergedGuidelines.rules = baseRules;

      const user = { ai_task_creation_guidelines: mergedGuidelines, teacher_specification: effectiveSpec };
      // Also log the guidelines after backend appends rubric/resources constraints (for comparison)
      try {
        console.log('[AI][Input] === ai_task_creation request (after merge) ===\n' + JSON.stringify(user, null, 2));
      } catch (_) {}

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: usedModel,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: JSON.stringify(user) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
      });

      console.log('[AI] OpenAI status:', resp.status, resp.statusText);
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.error('[AI] OpenAI error body:', text);
        return res.status(502).json({ ok: false, error: `OpenAI error ${resp.status}: ${text.slice(0, 512)}` });
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        console.error('[AI] OpenAI returned no content');
        return res.status(502).json({ ok: false, error: 'No content from OpenAI' });
      }
      let task;
      try {
        task = JSON.parse(content);
      } catch {
        console.error('[AI] Content was not valid JSON:', content?.slice?.(0, 500));
        return res.status(502).json({ ok: false, error: 'Invalid JSON from OpenAI' });
      }

      console.log('[AI] Generated task keys:', Object.keys(task || {}));
      console.log('[AI][Output] === ai_task_creation result (full) ===\n' + JSON.stringify(task, null, 2));
      return res.json({ ok: true, task, debug: { teacher_specification: effectiveSpec, guidelines: mergedGuidelines, model: usedModel, raw: content } });
    } catch (e) {
      console.error('Error in POST /api/tasks/ai/generate:', e);
      return res.status(500).json({ ok: false, error: 'Failed to generate task' });
    }
  });

  // POST /api/tasks/:id/hints
  // Body: { question?: string }
  // Returns: { ok: true, hints: string[], next_steps?: string[], pinpointed_issues?: string[] }
  router.post('/:id/hints', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const question = (req.body?.question || '').toString();

      async function getUserIdFromReq(req) {
        const sub = req?.auth?.payload?.sub;
        if (!sub) throw new Error('no auth sub');
        const u = await userModel.findByAuth0Id(sub);
        if (!u) throw new Error('user not found');
        return u.id;
      }

      async function buildAiTaskForTask(taskId) {
        const t = await pool.query(
          `SELECT id, task_title, objective, duration, level, academic_integrity, grading_rubric
             FROM tasks WHERE id=$1`,
          [taskId]
        );
        if (t.rowCount === 0) return null;
        const task = t.rows[0];
        const s = await pool.query(
          `SELECT section_type, content, display_order
             FROM task_sections WHERE task_id=$1 ORDER BY display_order ASC`,
          [taskId]
        );
        const pickArray = (type) => s.rows.find((r) => r.section_type === type)?.content || [];
        const instr = pickArray('instruction');
        const expected = pickArray('expected_output');
        const resources = pickArray('resources');
        const reflect = pickArray('reflection');
        const hints = pickArray('support_and_hints');
        let criteria = [];
        let rubric = [];
        const assess = s.rows.find((r) => r.section_type === 'assessment');
        if (assess && assess.content) {
          criteria = Array.isArray(assess.content.criteria) ? assess.content.criteria : [];
          rubric = Array.isArray(assess.content.rubric) ? assess.content.rubric : [];
        } else if (task.grading_rubric) {
          try { rubric = JSON.parse(task.grading_rubric); } catch (_) { rubric = []; }
        }
        return {
          title: task.task_title || '',
          objective: task.objective || '',
          instructions: Array.isArray(instr) ? instr : [],
          expected_output: Array.isArray(expected) ? expected : [],
          duration: task.duration || '',
          resources: Array.isArray(resources) ? resources : [],
          reflection_questions: Array.isArray(reflect) ? reflect : [],
          assessment_criteria: Array.isArray(criteria) ? criteria : [],
          rubric: Array.isArray(rubric) ? rubric : [],
          level_of_task: task.level || '',
          support_hints: Array.isArray(hints) ? hints : [],
          academic_integrity: task.academic_integrity || '',
        };
      }

      async function buildStudentContext(taskId, userId) {
        const s = await pool.query(
          `SELECT id, status, notes FROM submissions WHERE task_id=$1 AND student_id=$2 ORDER BY COALESCE(submitted_at, updated_at) DESC LIMIT 1`,
          [taskId, userId]
        );
        if (s.rowCount === 0) return { notes: '', links: [], files: [] };
        const sub = s.rows[0];
        const a = await pool.query(
          `SELECT asset_type, url, file_name FROM submission_assets WHERE submission_id=$1 ORDER BY created_at ASC`,
          [sub.id]
        );
        const links = a.rows.filter(r => r.url).map(r => r.url);
        const files = a.rows.filter(r => !r.url && r.file_name).map(r => r.file_name);
        return { notes: sub.notes || '', links, files };
      }

      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      if (!apiKey) return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY is not configured' });

      const ai_task = await buildAiTaskForTask(id);
      if (!ai_task) return res.status(404).json({ ok: false, error: 'task not found' });
      const userId = await getUserIdFromReq(req);
      const student = await buildStudentContext(id, userId);

      const system = 'You are a supportive tutor. Provide actionable hints grounded in the task objective and criteria. Do NOT reveal full solutions. Return JSON only.';
      const user = {
        task: {
          title: ai_task.title,
          objective: ai_task.objective,
          assessment_criteria: ai_task.assessment_criteria,
          support_hints: ai_task.support_hints,
        },
        student_submission: student,
        question: question || null,
        output_schema: {
          hints: ['Short, targeted hints (max 6)'],
          next_steps: ['Concrete steps student can do next (max 5)'],
          pinpointed_issues: ['Optional list of likely issues or misconceptions (max 5)'],
        }
      };

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: JSON.stringify(user) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        })
      });
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || '';
      let parsed = {};
      try { parsed = JSON.parse(content); } catch { parsed = {}; }
      const hints = Array.isArray(parsed.hints) ? parsed.hints : [];
      const next_steps = Array.isArray(parsed.next_steps) ? parsed.next_steps : [];
      const pinpointed_issues = Array.isArray(parsed.pinpointed_issues) ? parsed.pinpointed_issues : [];
      return res.json({ ok: true, hints, next_steps, pinpointed_issues, raw: content });
    } catch (e) {
      console.error('Error in POST /api/tasks/:id/hints:', e);
      return res.status(500).json({ ok: false, error: 'failed to generate hints' });
    }
  });

  return router;
};
