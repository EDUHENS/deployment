// backend/src/routes/submissionsAiRoute.js
const express = require('express');

module.exports = (requireAuth) => {
  const router = express.Router();

  function normalizeArray(x) {
    return Array.isArray(x) ? x.filter(Boolean).map(String) : [];
  }

  function renderRubric(rubric) {
    if (!Array.isArray(rubric) || rubric.length === 0) return 'No rubric provided.';
    const rows = rubric.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? '')).join(' | ') : String(row)));
    return rows.join('\n');
  }

  // Build an AI grading prompt using task rubric + student submission artefacts
  router.post('/assess-prompt', requireAuth, async (req, res) => {
    try {
      const { ai_task, submission } = req.body || {};
      if (!ai_task || typeof ai_task !== 'object') {
        return res.status(400).json({ ok: false, error: 'missing ai_task' });
      }

      const title = String(ai_task.title || '');
      const objective = String(ai_task.objective || '');
      const criteria = normalizeArray(ai_task.assessment_criteria);
      const rubric = Array.isArray(ai_task.rubric) ? ai_task.rubric : [];
      const expected = normalizeArray(ai_task.expected_output);
      const instructions = normalizeArray(ai_task.instructions);

      const studentLinks = normalizeArray(submission?.links);
      const studentFiles = normalizeArray(submission?.files);
      const studentNotes = String(submission?.notes || '');

      // Prompt (system + user)
      const system = [
        'You are a strict but fair educator assessing a student submission.',
        'Always grade against the provided rubric and criteria only.',
        'If evidence is missing or links are inaccessible, say so and grade conservatively.',
        'Return JSON only, matching the provided schema exactly. No extra keys, no prose outside JSON.'
      ].join(' ');

      const rubricBlock = renderRubric(rubric);
      const user = [
        `Task Title: ${title}`,
        `Objective: ${objective}`,
        '',
        'Instructions (summary):',
        instructions.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'N/A',
        '',
        'Expected Output:',
        expected.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'N/A',
        '',
        'Assessment Criteria:',
        criteria.map((c, i) => `- ${c}`).join('\n') || 'N/A',
        '',
        'Rubric (matrix; first row is headers):',
        rubricBlock,
        '',
        'Student Submission Artefacts:',
        `Links: ${studentLinks.length ? studentLinks.join(', ') : 'None'}`,
        `Files: ${studentFiles.length ? studentFiles.join(', ') : 'None'}`,
        `Student Note: ${studentNotes || 'None'}`,
        '',
        'Instructions to the model:',
        '- Inspect links/files (to the extent described) to find evidence. If not accessible, state limitation.',
        '- For each criterion, pick exactly one level from the rubric header columns (e.g., "Excellent", "Good (75–89%)", "Satisfactory (60–74%)", "Needs Improvement (<60%)").',
        '- Provide a one- or two-sentence justification for each criterion referencing concrete evidence.',
        '- Suggest concrete improvements if performance is below the top level for that criterion.',
        '- Decide overall pass|fail using the rubric and expected outputs. Be conservative if evidence is missing.',
        '- Output strictly in the JSON schema provided below.'
      ].join('\n');

      const schema = {
        overall: 'pass | fail',
        criteria: [
          {
            name: 'string (criterion name)',
            level: 'string (one rubric column header)',
            comment: 'string (justification with concrete evidence)',
            improvement: 'string (actionable next steps)'
          }
        ],
        summary: 'string (2–4 sentences overall feedback)',
        evidence_checked: studentLinks.length ? studentLinks : []
      };

      const prompt = {
        system,
        user,
        schema,
      };

      return res.json({ ok: true, prompt });
    } catch (e) {
      console.error('Build assess prompt error:', e);
      return res.status(500).json({ ok: false, error: 'failed to build prompt' });
    }
  });

  return router;
};

