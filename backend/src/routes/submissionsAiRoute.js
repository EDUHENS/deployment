// backend/src/routes/submissionsAiRoute.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { pool, userModel } = require('../database/index.js');
const { supabase, STORAGE_BUCKET } = require('../database/supabase.js');

module.exports = (requireAuth) => {
  const router = express.Router();

  async function getUserIdFromReq(req) {
    const claims = req?.auth?.payload;
    if (!claims?.sub) throw new Error('no auth sub');
    const user = await userModel.findByAuth0Id(claims.sub);
    if (!user) throw new Error('user not found');
    return user.id;
  }

  function normalizeArray(x) {
    return Array.isArray(x) ? x.filter(Boolean).map(String) : [];
  }

  function renderRubric(rubric) {
    if (!Array.isArray(rubric) || rubric.length === 0) return 'No rubric provided.';
    const rows = rubric.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? '')).join(' | ') : String(row)));
    return rows.join('\n');
  }

  async function getLatestSubmissionRecord(taskId, userId) {
    const result = await pool.query(
      `SELECT id, notes FROM submissions
        WHERE task_id=$1 AND student_id=$2
        ORDER BY updated_at DESC
        LIMIT 1`,
      [taskId, userId]
    );
    return result.rowCount ? result.rows[0] : null;
  }

  async function fetchSubmissionAssets(submissionId) {
    const rows = await pool.query(
      `SELECT id, asset_type, url, file_name, storage_key, mime_type
         FROM submission_assets
        WHERE submission_id=$1
        ORDER BY created_at ASC`,
      [submissionId]
    );
    return rows.rows || [];
  }

  async function buildLocalTextPreviewsFromAssets(rows) {
    try {
      const items = [];
      let total = 0;
      for (const asset of rows) {
        if (!asset.storage_key) continue;
        
        let txt = '';
        
        if (asset.storage_key.startsWith('submissions/')) {
          // Read from Supabase Storage
          try {
            const { data, error } = await supabase.storage
              .from(STORAGE_BUCKET)
              .download(asset.storage_key);
            if (error || !data) continue;
            const arrayBuffer = await data.arrayBuffer();
            const buf = Buffer.from(arrayBuffer);
            if (buf.length > 200_000) continue; // skip very large files
            txt = buf.toString('utf8');
          } catch (e) {
            console.error('[buildLocalTextPreviewsFromAssets] Error reading from Supabase:', e);
            continue;
          }
        } else {
          // Legacy filesystem path (backwards compatibility)
          try {
            const abs = path.resolve(process.cwd(), asset.storage_key);
            if (!fs.existsSync(abs)) continue;
            const stat = fs.statSync(abs);
            if (stat.size > 200_000) continue;
            txt = fs.readFileSync(abs, 'utf8');
          } catch {
            continue;
          }
        }
        
        if (!txt.trim()) continue;
        if (txt.length > 8000) txt = txt.slice(0, 8000) + '\n...[truncated]';
        items.push({ label: asset.file_name || path.basename(asset.storage_key), content: txt });
        total += txt.length;
        if (items.length >= 8 || total > 50_000) break;
      }
      if (!items.length) return '';
      return ['','Student uploaded files (previews):', ...items.map(it => `# ${it.label}\n${it.content}`)].join('\n');
    } catch {
      return '';
    }
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

  // Actually run AI assessment on a draft submission
  // POST /api/submissions/ai/assess
  // Body: { task_id: string, submission?: { links: string[], files: string[], notes: string } }
  router.post('/assess', requireAuth, async (req, res) => {
    try {
      const { task_id, submission } = req.body || {};
      if (!task_id) return res.status(400).json({ ok: false, error: 'missing task_id' });

      // Fetch task's ai_task data (similar to form-student endpoint)
      const userId = await getUserIdFromReq(req);
      // Check enrollment
      const enrolled = await pool.query(
        `SELECT 1 FROM task_enrollments WHERE task_id=$1 AND user_id=$2`,
        [task_id, userId]
      );
      if (enrolled.rowCount === 0) return res.status(403).json({ ok: false, error: 'not enrolled' });

      const t = await pool.query(
        `SELECT id, task_title, objective, grading_rubric
         FROM tasks WHERE id = $1`,
        [task_id]
      );
      if (t.rowCount === 0) return res.status(404).json({ ok: false, error: 'task not found' });
      const task = t.rows[0];

      const s = await pool.query(
        `SELECT section_type, content, display_order
         FROM task_sections WHERE task_id = $1 ORDER BY display_order ASC`,
        [task_id]
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

      // Get full task details including duration and level
      const taskDetails = await pool.query(
        `SELECT duration, level, academic_integrity FROM tasks WHERE id = $1`,
        [task_id]
      );
      const taskMeta = taskDetails.rows[0] || {};

      const ai_task = {
        title: task.task_title || '',
        objective: task.objective || '',
        instructions: Array.isArray(instr) ? instr : [],
        expected_output: Array.isArray(expected) ? expected : [],
        resources: Array.isArray(resources) ? resources : [],
        reflection_questions: Array.isArray(reflect) ? reflect : [],
        support_hints: Array.isArray(hints) ? hints : [],
        duration: taskMeta.duration || '',
        level: taskMeta.level || '',
        academic_integrity: taskMeta.academic_integrity || '',
        assessment_criteria: Array.isArray(criteria) ? criteria : [],
        rubric: Array.isArray(rubric) ? rubric : [],
      };

      const latestSubmission = await getLatestSubmissionRecord(task_id, userId);
      const assets = latestSubmission ? await fetchSubmissionAssets(latestSubmission.id) : [];

      const dbLinks = assets.filter((a) => a.url).map((a) => a.url);
      const manualLinks = normalizeArray(submission?.links);
      const studentLinks = Array.from(new Set([...dbLinks, ...manualLinks]));

      const dbFiles = assets.filter((a) => !a.url && a.file_name).map((a) => a.file_name);
      const manualFiles = normalizeArray(submission?.files);
      const studentFiles = Array.from(new Set([...dbFiles, ...manualFiles]));

      const studentNotes = submission?.notes?.trim()
        ? String(submission.notes)
        : String(latestSubmission?.notes || '');

      // Check if we have any files or links (either from DB or from request)
      // For files, we need actual uploaded files (with storage_key), not just file names
      const hasUploadedFiles = assets.some((a) => a.storage_key);
      const hasLinks = studentLinks.length > 0;
      // Allow assessment if there are links OR if there are uploaded files in the database
      // File names alone (without upload) are not enough for assessment
      const hasFiles = hasUploadedFiles;
      
      if (!hasLinks && !hasFiles) {
        return res.status(400).json({
          ok: false,
          error: 'Please upload at least one file or provide a valid link before requesting an assessment.',
        });
      }

      // Fetch and analyze link contents (similar to tryAutoGrade)
      async function normalizeGitHubLinkToRawCandidates(link) {
        try {
          const url = new URL(link);
          const host = url.hostname.toLowerCase();
          const path = url.pathname.replace(/\/+/, '/');

          if (host === 'raw.githubusercontent.com') {
            return [{ url: link, label: path }];
          }

          if (host === 'github.com') {
            const parts = path.split('/').filter(Boolean);
            if (parts.length >= 5 && (parts[2] === 'blob' || parts[2] === 'raw')) {
              const [owner, repo, , ref, ...rest] = parts;
              const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest.join('/')}`;
              return [{ url: raw, label: `/${owner}/${repo}/${ref}/${rest.join('/')}` }];
            }
            if (parts.length >= 3) {
              const [owner, repo] = parts;
              let ref = 'main';
              let subpath = '';
              if (parts[2] === 'tree' && parts.length >= 4) {
                ref = parts[3] || 'main';
                subpath = parts.slice(4).join('/');
              }
              const candidates = [];
              const base = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;
              const tryFiles = [
                'README.md', 'README.txt', 'readme.md', 'README',
                'index.md', 'index.html', 'index.tsx', 'index.ts', 'index.js',
                'app.js', 'main.ts', 'main.js', 'styles.css'
              ];
              if (subpath) {
                for (const f of tryFiles) {
                  candidates.push({ url: `${base}/${subpath}/${f}`, label: `/${owner}/${repo}/${ref}/${subpath}/${f}` });
                }
              }
              for (const f of tryFiles) {
                candidates.push({ url: `${base}/${f}`, label: `/${owner}/${repo}/${ref}/${f}` });
              }
              return candidates;
            }
          }
        } catch {}
        return [{ url: link, label: link }];
      }

      async function fetchTextIfSmall(url, abortSignal) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
          const resp = await fetch(url, {
            signal: abortSignal || controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EduHens/1.0)' },
          });
          clearTimeout(timeoutId);
          if (!resp.ok) {
            console.warn('[AI assess] fetch failed', url, resp.status, resp.statusText);
            return null;
          }
          const ct = resp.headers.get('content-type') || '';
          const isTextLike =
            ct.includes('text') ||
            ct.includes('markdown') ||
            ct.includes('json') ||
            ct.includes('html') ||
            ct.includes('javascript') ||
            /\.(js|ts|jsx|tsx|html|css|md|json|txt)$/i.test(url);
          if (!isTextLike) return null;
          const buf = await resp.arrayBuffer();
          if (buf.byteLength > 300_000) return null;
          const txt = Buffer.from(buf).toString('utf8');
          return txt.trim() ? txt : null;
        } catch (e) {
          console.warn('[AI assess] fetch error', url, e.message);
          return null;
        }
      }

      async function buildFetchedContents(links) {
        const controller = new AbortController();
        const { signal } = controller;
        const seen = new Set();
        const items = [];
        let total = 0;
        for (const link of links) {
          const candidates = await normalizeGitHubLinkToRawCandidates(link);
          for (const c of candidates) {
            if (seen.has(c.url)) continue;
            seen.add(c.url);
            const txt = await fetchTextIfSmall(c.url, signal);
            if (txt && txt.trim()) {
              const trimmed = txt.length > 8000 ? (txt.slice(0, 8000) + '\n...[truncated]') : txt;
              items.push({ label: c.label || c.url, content: trimmed });
              total += trimmed.length;
              if (items.length >= 8 || total > 50_000) {
                return items;
              }
            }
          }
          if (items.length >= 8 || total > 50_000) break;
        }
        return items;
      }

      const fetched = await buildFetchedContents(studentLinks);
      const fetchedBlock = fetched.length
        ? ('\n\nFetched file contents from links:\n' + fetched.map(it => `---\n${it.label}\n${it.content}`).join('\n') + '\n---\n')
        : '\n[No readable file contents fetched from links - links may be inaccessible or not contain readable text]\n';
      const localBlock = assets.length
        ? await buildLocalTextPreviewsFromAssets(assets)
        : '\n[No uploaded file previews available]\n';

      // Build comprehensive prompt for detailed AI assessment
      const system = [
        'You are an expert educator with deep technical knowledge, assessing a student submission with meticulous attention to detail.',
        'Your role is to provide comprehensive, constructive feedback that helps students understand both what was done well and what needs improvement.',
        'IMPORTANT: Use PASSIVE VOICE throughout your feedback. Instead of saying "the student did X" or "the student does Y", say "the task was completed" or "the requirement is met" or "the code implements X".',
        'Examples of passive voice:',
        '  - Instead of "The student created a function" → "A function was created"',
        '  - Instead of "The student did not include error handling" → "Error handling was not included"',
        '  - Instead of "The student demonstrates understanding" → "Understanding is demonstrated"',
        '  - Instead of "The student submitted incomplete work" → "The submission is incomplete"',
        'You have access to:',
        '  - The complete task requirements (instructions, expected outputs, resources, reflection questions, hints)',
        '  - The actual content from student-submitted files and links (code, documents, etc.)',
        '  - The student\'s notes and reflections',
        '  - The assessment rubric and criteria',
        'Analyze ALL of this information thoroughly. Do not provide generic feedback - be specific and evidence-based.',
        'When analyzing code/files:',
        '  - Examine the actual implementation, structure, and quality',
        '  - Check if requirements are met, partially met, or missing',
        '  - Identify specific code patterns, functions, or features present or absent',
        '  - Note code quality, organization, and best practices',
        'When analyzing links:',
        '  - Access and review the actual content from the links',
        '  - Verify if the linked content demonstrates task completion',
        '  - Check if the content matches the task requirements',
        'When the submission fails:',
        '  - Explain WHY the submission fails (root cause analysis) using passive voice',
        '  - List WHAT specific requirements are missing or incorrect',
        '  - Provide HOW-TO-PASS instructions with clear, numbered, actionable steps',
        'When the submission passes:',
        '  - Highlight what was done well with specific examples (using passive voice)',
        '  - Note any areas that could be improved even if the task passes',
        '  - Provide encouragement and constructive suggestions for enhancement',
        'Your feedback should be detailed, specific, and educational - helping the student learn and improve.',
        'Return JSON only, matching the provided schema exactly. No extra keys, no prose outside JSON.'
      ].join(' ');

      const rubricBlock = renderRubric(ai_task.rubric);
      const user = [
        '=== TASK DETAILS ===',
        `Task Title: ${ai_task.title}`,
        `Objective: ${ai_task.objective || 'N/A'}`,
        `Duration: ${ai_task.duration || 'N/A'}`,
        `Level: ${ai_task.level || 'N/A'}`,
        '',
        '=== TASK INSTRUCTIONS ===',
        ai_task.instructions.length > 0
          ? ai_task.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')
          : 'No specific instructions provided.',
        '',
        '=== EXPECTED OUTPUTS ===',
        ai_task.expected_output.length > 0
          ? ai_task.expected_output.map((s, i) => `${i + 1}. ${s}`).join('\n')
          : 'No specific expected outputs defined.',
        '',
        '=== RESOURCES PROVIDED TO STUDENT ===',
        ai_task.resources.length > 0
          ? ai_task.resources.map((r, i) => `${i + 1}. ${r}`).join('\n')
          : 'No resources provided.',
        '',
        '=== REFLECTION QUESTIONS ===',
        ai_task.reflection_questions.length > 0
          ? ai_task.reflection_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
          : 'No reflection questions provided.',
        '',
        '=== SUPPORT HINTS ===',
        ai_task.support_hints.length > 0
          ? ai_task.support_hints.map((h, i) => `${i + 1}. ${h}`).join('\n')
          : 'No support hints provided.',
        '',
        '=== ASSESSMENT CRITERIA ===',
        ai_task.assessment_criteria.length > 0
          ? ai_task.assessment_criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')
          : 'No specific assessment criteria defined.',
        '',
        '=== GRADING RUBRIC ===',
        rubricBlock || 'No rubric provided.',
        '',
        '=== ACADEMIC INTEGRITY REQUIREMENTS ===',
        ai_task.academic_integrity || 'Standard academic integrity applies.',
        '',
        '=== STUDENT SUBMISSION ===',
        '',
        'Submitted Links:',
        studentLinks.length > 0
          ? studentLinks.map((l, i) => `${i + 1}. ${l}`).join('\n')
          : 'No links submitted.',
        '',
        'Submitted Files:',
        studentFiles.length > 0
          ? studentFiles.map((f, i) => `${i + 1}. ${f}`).join('\n')
          : 'No files submitted.',
        '',
        'Student Notes/Reflection:',
        studentNotes || 'No notes or reflection provided by the student.',
        '',
        '=== UPLOADED FILE CONTENT ===',
        localBlock || '[No uploaded file content available for analysis]',
        '',
        '=== FETCHED LINK CONTENT ===',
        fetchedBlock || '[No link content could be fetched for analysis]',
        '',
        '=== ASSESSMENT INSTRUCTIONS ===',
        '',
        'You must provide a comprehensive, detailed assessment based on ALL the information above.',
        'REMEMBER: Use PASSIVE VOICE throughout your feedback. Write as if describing the task/submission itself, not the student\'s actions.',
        '',
        'ANALYSIS REQUIREMENTS:',
        '1. Review ALL task requirements (instructions, expected outputs, resources, reflection questions, hints)',
        '2. Examine ALL student submission artifacts (files, links, notes)',
        '3. Analyze the actual content from uploaded files and fetched links',
        '4. Compare the submission against each assessment criterion',
        '5. Evaluate using the provided rubric',
        '',
        'FEEDBACK REQUIREMENTS:',
        '- Be SPECIFIC: Reference exact code snippets, file names, features, or content found or missing',
        '- Be EVIDENCE-BASED: Base all conclusions on actual content from files/links, not assumptions',
        '- Be CONSTRUCTIVE: Help the student understand what to improve and how',
        '- Be COMPREHENSIVE: Cover all aspects of the submission, not just pass/fail',
        '- Use PASSIVE VOICE: Describe what was done, not who did it (e.g., "The function was implemented" not "The student implemented the function")',
        '',
        'FOR EACH CRITERION:',
        '- Select the appropriate rubric level (e.g., "Excellent", "Good (75–89%)", "Satisfactory (60–74%)", "Needs Improvement (<60%)")',
        '- Provide a detailed justification (2-4 sentences) with SPECIFIC evidence from the submission (using passive voice)',
        '- Include actionable improvement suggestions if not at the highest level',
        '',
        'OVERALL ASSESSMENT:',
        '- Determine pass/fail based on whether the submission meets the minimum requirements',
        '- The "summary" field should be a comprehensive 3-5 sentence analysis explaining (using passive voice):',
        '  * What was done well (be specific with examples)',
        '  * How well the submission meets the task requirements',
        '  * Overall quality and completeness',
        '',
        'CRITICAL: You MUST declare either "pass" or "fail" in the "overall" field. This is mandatory.',
        '',
        'IF THE SUBMISSION FAILS (overall: "fail"), you MUST provide ALL of the following (using passive voice):',
        '- "failure_reason": A detailed explanation (2-3 sentences) of WHY the submission fails',
        '- "what_is_missing": A specific list of WHAT requirements are not met (bullet points or numbered list) - THIS IS REQUIRED',
        '- "how_to_pass": Clear, numbered, actionable steps (3-5 steps) that must be completed to pass',
        '- "what_went_well": Even for failures, acknowledge what was done correctly (if anything)',
        '- "what_could_be_improved": Suggestions for improvement',
        '',
        'IF THE SUBMISSION PASSES (overall: "pass"), you MUST provide (using passive voice):',
        '- "what_went_well": Specific examples of what was done well (2-3 sentences)',
        '- "what_could_be_improved": Constructive suggestions for enhancement even if passing (2-3 sentences)',
        '',
        'The assessment MUST be based on the task requirements, instructions, expected outputs, and rubric provided above.',
        'Compare the student submission against ALL task requirements to determine pass/fail.',
        '',
        'Output strictly in the JSON schema provided below. Be thorough and detailed in all fields.'
      ].join('\n');

      const schema = {
        overall: 'pass | fail',
        overall_score: 'number (0-100, calculated based on rubric levels)',
        criteria: [
          {
            name: 'string (criterion name from assessment_criteria)',
            level: 'string (one rubric column header, e.g., "Excellent", "Good (75–89%)", "Satisfactory (60–74%)", "Needs Improvement (<60%)")',
            comment: 'string (2-4 sentences with detailed justification and specific evidence from submission content)',
            improvement: 'string (actionable next steps for improvement, even if passing)'
          }
        ],
        summary: 'string (3-5 sentences: comprehensive analysis of what went well, how submission meets requirements, overall quality)',
        what_went_well: 'string (2-3 sentences with specific examples of what was done well - REQUIRED for both pass and fail)',
        what_could_be_improved: 'string (2-3 sentences with constructive suggestions for enhancement - REQUIRED for both pass and fail)',
        failure_reason: 'string (2-3 sentences explaining WHY the submission fails - REQUIRED if overall is "fail")',
        what_is_missing: 'string (specific list of WHAT requirements are not met - REQUIRED if overall is "fail")',
        how_to_pass: 'string (3-5 numbered, actionable steps to pass - REQUIRED if overall is "fail")',
        evidence_checked: 'array of strings (list of links/files that were successfully analyzed)'
      };

      // Call OpenAI
      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY is not configured' });
      }

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('OpenAI API error:', errorText);
        return res.status(500).json({ ok: false, error: 'AI assessment failed' });
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || '';
      
      let parsed = {};
      try {
        let cleaned = content.trim();
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        return res.status(500).json({ ok: false, error: 'Failed to parse AI assessment' });
      }

      // Calculate score
      let overallScore = null;
      if (typeof parsed.overall_score === 'number') {
        overallScore = Math.max(0, Math.min(100, Math.round(parsed.overall_score)));
      } else if (parsed.overall === 'pass') {
        // If passing but no score provided, calculate from criteria levels if available
        if (Array.isArray(parsed.criteria) && parsed.criteria.length > 0) {
          // Simple heuristic: if all criteria are at "Good" or above, assign 75-100
          overallScore = 75;
        } else {
          overallScore = 60;
        }
      } else if (parsed.overall === 'fail') {
        overallScore = 0;
      }

      // Ensure overall is always 'pass' or 'fail'
      const overall = (parsed.overall || '').toLowerCase();
      const finalOverall = (overall === 'pass' || overall === 'fail') ? overall : 'fail'; // Default to fail if not clear

      // For failures, ensure what_is_missing is provided
      if (finalOverall === 'fail' && !parsed.what_is_missing) {
        parsed.what_is_missing = parsed.failure_reason || 'Specific requirements were not met. Please review the task instructions and expected outputs.';
      }

      // Save assessment to database if submission exists (reuse existing latestSubmission from above)
      if (latestSubmission) {
        // Convert assessment to JSON string for storage
        const assessmentJson = JSON.stringify({
          overall: finalOverall,
          overall_score: overallScore,
          summary: parsed.summary || null,
          what_went_well: parsed.what_went_well || null,
          what_could_be_improved: parsed.what_could_be_improved || null,
          failure_reason: parsed.failure_reason || null,
          what_is_missing: parsed.what_is_missing || null,
          how_to_pass: parsed.how_to_pass || null,
          criteria: Array.isArray(parsed.criteria) ? parsed.criteria : [],
          evidence_checked: Array.isArray(parsed.evidence_checked) ? parsed.evidence_checked : [],
        });
        
        // Save to database
        await pool.query(
          `UPDATE submissions SET ai_feedback=$2, ai_score=$3, updated_at=now() WHERE id=$1`,
          [latestSubmission.id, assessmentJson, overallScore]
        );
        console.log(`[AI Assessment] Saved assessment for submission ${latestSubmission.id}: ${finalOverall}`);
      }

      return res.json({
        ok: true,
        assessment: {
          overall: finalOverall,
          overall_score: overallScore,
          summary: parsed.summary || null,
          what_went_well: parsed.what_went_well || null,
          what_could_be_improved: parsed.what_could_be_improved || null,
          failure_reason: parsed.failure_reason || null,
          what_is_missing: parsed.what_is_missing || null,
          how_to_pass: parsed.how_to_pass || null,
          criteria: Array.isArray(parsed.criteria) ? parsed.criteria : [],
          evidence_checked: Array.isArray(parsed.evidence_checked) ? parsed.evidence_checked : [],
          raw: content
        }
      });
    } catch (e) {
      console.error('AI assess error:', e);
      console.error('AI assess error stack:', e.stack);
      const errorMessage = e.message || 'unknown error';
      return res.status(500).json({ ok: false, error: `failed to assess submission: ${errorMessage}` });
    }
  });

  return router;
};

