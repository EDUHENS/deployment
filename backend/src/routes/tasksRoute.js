// backend/src/routes/tasksRoute.js
const express = require('express');
const crypto = require('crypto');
const { pool, userModel } = require('../database/index.js');

module.exports = (requireAuth) => {
  const router = express.Router();

  async function mintShareSlug() {
    for (let i = 0; i < 6; i++) {
      const slug = crypto.randomBytes(6).toString('hex');
      const dup = await pool.query('SELECT 1 FROM tasks WHERE share_slug = $1', [slug]);
      if (dup.rowCount === 0) return slug;
    }
    throw new Error('failed to mint unique share slug');
  }

  function normalizeRubric(aiTask) {
    const criteria = Array.isArray(aiTask?.assessment_criteria) ? aiTask.assessment_criteria : [];
    let rubric2D = Array.isArray(aiTask?.rubric) ? aiTask.rubric : [];
    const header = ['Criteria','Excellent','Good (75–89%)','Satisfactory (60–74%)','Needs Improvement (<60%)'];
    const is2D = Array.isArray(rubric2D) && rubric2D.every((row) => Array.isArray(row));
    if (!is2D || rubric2D.length === 0) {
      rubric2D = [header, ...criteria.map((c) => [c, '—', '—', '—', '—'])];
    } else {
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
    return { criteria, rubric2D };
  }

  function mapAiTaskToDb(aiTask) {
    const normalizedResources = Array.isArray(aiTask?.resources)
      ? aiTask.resources.map((r) => {
          if (typeof r === 'string') return r;
          if (r && typeof r.title === 'string' && typeof r.url === 'string') return `${r.title} - ${r.url}`;
          return String(r);
        })
      : [];

    const sections = [];
    let order = 1;
    if (Array.isArray(aiTask?.instructions) && aiTask.instructions.length) {
      sections.push({ section_type: 'instruction', allow_additions: false, display_order: order++, content: aiTask.instructions });
    }
    if (Array.isArray(aiTask?.expected_output) && aiTask.expected_output.length) {
      sections.push({ section_type: 'expected_output', allow_additions: false, display_order: order++, content: aiTask.expected_output });
    }
    if (normalizedResources.length) {
      sections.push({ section_type: 'resources', allow_additions: false, display_order: order++, content: normalizedResources });
    }
    if (Array.isArray(aiTask?.reflection_questions) && aiTask.reflection_questions.length) {
      sections.push({ section_type: 'reflection', allow_additions: false, display_order: order++, content: aiTask.reflection_questions });
    }
    if (Array.isArray(aiTask?.assessment_criteria) || Array.isArray(aiTask?.rubric)) {
      const { criteria, rubric2D } = normalizeRubric(aiTask);
      const assessmentContent = { criteria, rubric: rubric2D };
      sections.push({ section_type: 'assessment', allow_additions: false, display_order: order++, content: assessmentContent });
    }
    if (Array.isArray(aiTask?.support_hints) && aiTask.support_hints.length) {
      sections.push({ section_type: 'support_and_hints', allow_additions: false, display_order: order++, content: aiTask.support_hints });
    }

    return {
      taskFields: {
        task_title: aiTask?.title || '',
        objective: aiTask?.objective || '',
        duration: aiTask?.duration || null,
        level: aiTask?.level_of_task || null,
        academic_integrity: aiTask?.academic_integrity || null,
        grading_rubric: JSON.stringify(normalizeRubric(aiTask).rubric2D)
      },
      sections
    };
  }

  async function getTeacherIdFromReq(req) {
    const claims = req?.auth?.payload;
    if (!claims?.sub) throw new Error('no auth sub');
    const user = await userModel.findByAuth0Id(claims.sub);
    if (!user) throw new Error('user not found');
    return user.id;
  }

  async function getUserIdFromReq(req) {
    const claims = req?.auth?.payload;
    if (!claims?.sub) throw new Error('no auth sub');
    const user = await userModel.findByAuth0Id(claims.sub);
    if (!user) throw new Error('user not found');
    return user.id;
  }

  // Create draft task from AI/form
  router.post('/', requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
      const teacherId = await getTeacherIdFromReq(req);

      const { ai_task, ai_guidelines, opens_at, due_at, study_link, access_code, ai_generated } = req.body || {};
      if (!ai_task || typeof ai_task !== 'object') return res.status(400).json({ ok: false, error: 'missing ai_task' });
      const { taskFields, sections } = mapAiTaskToDb(ai_task);

      await client.query('BEGIN');
      // Generate share_slug immediately when creating draft so link is available
      const shareSlug = await mintShareSlug();
      const ins = await client.query(
        `INSERT INTO tasks (
           teacher_id, task_title, objective, duration, level, academic_integrity,
           grading_rubric, ai_generated, ai_guidelines,
           opens_at, due_at, status, share_enabled, share_slug, study_link, access_code
         ) VALUES (
           $1,$2,$3,$4,$5,$6,
           $7, COALESCE($8, true), $9,
           $10,$11, 'draft', false, $14, $12, $13
         ) RETURNING id, share_slug`,
        [
          teacherId,
          taskFields.task_title,
          taskFields.objective,
          taskFields.duration,
          taskFields.level,
          taskFields.academic_integrity,
          taskFields.grading_rubric,
          ai_generated,
          ai_guidelines ? JSON.stringify(ai_guidelines) : null,
          opens_at || null,
          due_at || null,
          study_link || null,
          access_code || null,
          shareSlug
        ]
      );
      const taskId = ins.rows[0].id;
      const slug = ins.rows[0].share_slug;

      for (const s of sections) {
        await client.query(
          `INSERT INTO task_sections (task_id, section_type, allow_additions, display_order, content)
           VALUES ($1,$2,$3,$4,$5::jsonb)`,
          [taskId, s.section_type, s.allow_additions, s.display_order, JSON.stringify(s.content)]
        );
      }

      await client.query('COMMIT');
      const base = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';
      const link = slug ? `${base}/t/${slug}` : null;
      console.log(`[DB] Task created: "${taskFields.task_title}" (${taskId})${link ? `, link=${link}` : ''}`);
      return res.json({ ok: true, task_id: taskId, status: 'draft', link });
    } catch (e) {
      await pool.query('ROLLBACK');
      console.error('Create draft error:', e);
      return res.status(500).json({ ok: false, error: 'failed to create draft' });
    } finally {
      client.release();
    }
  });

  // Replace sections for a task (save changes)
  router.put('/:id/sections', requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { ai_task } = req.body || {};
      if (!ai_task) return res.status(400).json({ ok: false, error: 'missing ai_task' });
      const { sections } = mapAiTaskToDb(ai_task);
      const t = await pool.query('SELECT task_title FROM tasks WHERE id = $1', [id]);
      const taskTitle = t.rows[0]?.task_title || '(unknown)';

      await client.query('BEGIN');
      await client.query('DELETE FROM task_sections WHERE task_id = $1', [id]);
      for (const s of sections) {
        await client.query(
          `INSERT INTO task_sections (task_id, section_type, allow_additions, display_order, content)
           VALUES ($1,$2,$3,$4,$5::jsonb)`,
          [id, s.section_type, s.allow_additions, s.display_order, JSON.stringify(s.content)]
        );
      }
      // Bump task updated_at to reflect content change
      await client.query('UPDATE tasks SET updated_at = now() WHERE id = $1', [id]);
      await client.query('COMMIT');
      console.log(`[DB] Task sections saved: "${taskTitle}" (${id})`);
       // Prevent stale caches from hiding fresh rubric/sections
      res.set('Cache-Control', 'no-store');
      return res.json({ ok: true });
    } catch (e) {
      await pool.query('ROLLBACK');
      console.error('Replace sections error:', e);
      return res.status(500).json({ ok: false, error: 'failed to replace sections' });
    } finally {
      client.release();
    }
  });

  // Update main task fields (save draft)
  router.put('/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { task_title, objective, duration, level, academic_integrity,
              ai_guidelines, opens_at, due_at, study_link, access_code } = req.body || {};

      const result = await pool.query(
        `UPDATE tasks SET
           task_title = COALESCE($2, task_title),
           objective = COALESCE($3, objective),
           duration = COALESCE($4, duration),
           level = COALESCE($5, level),
           academic_integrity = COALESCE($6, academic_integrity),
           ai_guidelines = COALESCE($7::jsonb, ai_guidelines),
           opens_at = COALESCE($8, opens_at),
           due_at = COALESCE($9, due_at),
           study_link = COALESCE($10, study_link),
           access_code = COALESCE($11, access_code),
           updated_at = now()
         WHERE id = $1
         RETURNING id, status, task_title`,
        [id, task_title, objective, duration, level, academic_integrity,
         ai_guidelines ? JSON.stringify(ai_guidelines) : null,
         opens_at || null, due_at || null, study_link || null, access_code || null]
      );
      if (result.rowCount === 0) return res.status(404).json({ ok: false, error: 'task not found' });
      const updated = result.rows[0];
      console.log(`[DB] Task updated: "${updated.task_title}" (${updated.id})`);
      return res.json({ ok: true, task: updated });
    } catch (e) {
      console.error('Update task error:', e);
      return res.status(500).json({ ok: false, error: 'failed to update task' });
    }
  });

  // Publish / unpublish / archive
  router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      if (!['draft', 'published', 'archived'].includes(status)) return res.status(400).json({ ok: false, error: 'invalid status' });

      if (status === 'published') {
        let slug;
        const check = await pool.query('SELECT share_slug FROM tasks WHERE id=$1', [id]);
        slug = check.rows[0]?.share_slug;
        if (!slug) slug = await mintShareSlug();
        await pool.query(
          `UPDATE tasks SET
             status='published',
             published_at=now(),
             share_enabled=true,
             share_slug=COALESCE(share_slug, $2),
             updated_at=now()
           WHERE id=$1`,
          [id, slug]
        );
      } else if (status === 'draft') {
        await pool.query(
          `UPDATE tasks SET status='draft', share_enabled=false, updated_at=now() WHERE id=$1`,
          [id]
        );
      } else if (status === 'archived') {
        await pool.query(`UPDATE tasks SET status='archived', updated_at=now() WHERE id=$1`, [id]);
      }

      const r = await pool.query(`SELECT id, task_title, status, share_enabled, share_slug, published_at FROM tasks WHERE id=$1`, [id]);
      const base = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';
      const link = r.rows[0].share_slug ? `${base}/t/${r.rows[0].share_slug}` : null;
      console.log(`[DB] Task status changed: "${r.rows[0].task_title}" (${id}) -> ${r.rows[0].status}${link ? `, link=${link}` : ''}`);
      return res.json({ ok: true, task: r.rows[0], link });
    } catch (e) {
      console.error('Change status error:', e);
      return res.status(500).json({ ok: false, error: 'failed to change status' });
    }
  });

  // Load a single task as ai_task form payload (for editor)
  router.get('/:id/form', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const teacherId = await getTeacherIdFromReq(req);
      const t = await pool.query(
        `SELECT id, teacher_id, task_title, objective, duration, level, academic_integrity,
                grading_rubric, status, opens_at, due_at, published_at, share_enabled, share_slug
         FROM tasks WHERE id = $1 AND teacher_id = $2`,
        [id, teacherId]
      );
      if (t.rowCount === 0) return res.status(404).json({ ok: false, error: 'task not found' });
      const task = t.rows[0];

      const s = await pool.query(
        `SELECT section_type, content, display_order
         FROM task_sections WHERE task_id = $1 ORDER BY display_order ASC`,
        [id]
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

      const ai_task = {
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

      const base = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';
      const link = task.share_slug ? `${base}/t/${task.share_slug}` : null;
      res.set('Cache-Control', 'no-store');
      return res.json({ ok: true, task: { id: task.id, status: task.status, opens_at: task.opens_at, due_at: task.due_at, link }, ai_task });
    } catch (e) {
      console.error('Get task form error:', e);
      return res.status(500).json({ ok: false, error: 'failed to load task form' });
    }
  });

  // Student-facing: load task form if the current user is enrolled in the task
  router.get('/:id/form-student', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = await getUserIdFromReq(req);
      // Ensure the user is enrolled to the task
      const enrolled = await pool.query(
        `SELECT 1 FROM task_enrollments WHERE task_id=$1 AND user_id=$2`,
        [id, userId]
      );
      if (enrolled.rowCount === 0) return res.status(403).json({ ok: false, error: 'not enrolled' });

      const t = await pool.query(
        `SELECT id, task_title, objective, duration, level, academic_integrity,
                grading_rubric, status, opens_at, due_at, published_at, share_enabled, share_slug
         FROM tasks WHERE id = $1`,
        [id]
      );
      if (t.rowCount === 0) return res.status(404).json({ ok: false, error: 'task not found' });
      const task = t.rows[0];

      const s = await pool.query(
        `SELECT section_type, content, display_order
         FROM task_sections WHERE task_id = $1 ORDER BY display_order ASC`,
        [id]
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

      const ai_task = {
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

      return res.json({ ok: true, ai_task });
    } catch (e) {
      console.error('Get student task form error:', e);
      return res.status(500).json({ ok: false, error: 'failed to load task form' });
    }
  });

  // List tasks for the current teacher (includes drafts)
  router.get('/', requireAuth, async (req, res) => {
    try {
      const teacherId = await getTeacherIdFromReq(req);
      const r = await pool.query(
        `SELECT id, task_title, status, opens_at, due_at, published_at, share_enabled, share_slug, updated_at
         FROM tasks
         WHERE teacher_id = $1
         ORDER BY updated_at DESC`,
        [teacherId]
      );
      
      // For each task, get submission count and average clarity score
      const tasksWithStats = await Promise.all(r.rows.map(async (row) => {
        // Get submission count
        const subCount = await pool.query(
          `SELECT COUNT(*) as count FROM submissions WHERE task_id = $1`,
          [row.id]
        );
        const submissionCount = parseInt(subCount.rows[0]?.count || '0', 10);
        
        // Get average clarity score
        const clarityAvg = await pool.query(
          `SELECT AVG(clarity_score)::numeric(10,2) as avg_clarity
           FROM submissions
           WHERE task_id = $1 AND clarity_score IS NOT NULL`,
          [row.id]
        );
        const avgClarity = clarityAvg.rows[0]?.avg_clarity 
          ? parseFloat(clarityAvg.rows[0].avg_clarity) 
          : null;
        
        const base = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';
        return {
          ...row,
          link: row.share_slug ? `${base}/t/${row.share_slug}` : null,
          submission_count: submissionCount,
          avg_clarity_score: avgClarity,
        };
      }));
      
      return res.json({ ok: true, tasks: tasksWithStats });
    } catch (e) {
      console.error('List tasks error:', e);
      return res.status(500).json({ ok: false, error: 'failed to list tasks' });
    }
  });

  // List enrollments (students) for a task owned by the current teacher
  router.get('/:id/enrollments', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const teacherId = await getTeacherIdFromReq(req);
      const t = await pool.query('SELECT id FROM tasks WHERE id=$1 AND teacher_id=$2', [id, teacherId]);
      if (t.rowCount === 0) return res.status(404).json({ ok: false, error: 'task not found' });

      const r = await pool.query(
        `SELECT e.user_id, u.name, u.email, u.picture, e.enrolled_at
           FROM task_enrollments e
           JOIN users u ON u.id = e.user_id
          WHERE e.task_id = $1
          ORDER BY e.enrolled_at DESC`,
        [id]
      );
      return res.json({ ok: true, enrollments: r.rows });
    } catch (e) {
      console.error('List enrollments error:', e);
      return res.status(500).json({ ok: false, error: 'failed to list enrollments' });
    }
  });

  // List real submissions for a task owned by current teacher
  router.get('/:id/submissions', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const teacherId = await getTeacherIdFromReq(req);
      const t = await pool.query('SELECT id FROM tasks WHERE id=$1 AND teacher_id=$2', [id, teacherId]);
      if (t.rowCount === 0) return res.status(404).json({ ok: false, error: 'task not found' });

      const r = await pool.query(
        `SELECT s.id, s.status, s.submitted_at, s.graded_at, s.ai_score, s.ai_feedback,
                s.educator_score, s.educator_feedback, s.notes, s.clarity_score,
                u.name, u.email, u.picture
           FROM submissions s
           JOIN users u ON u.id = s.student_id
          WHERE s.task_id = $1
          ORDER BY COALESCE(s.submitted_at, s.created_at) DESC`,
        [id]
      );

      // Calculate average clarity score for this task
      const clarityAvg = await pool.query(
        `SELECT AVG(clarity_score)::numeric(10,2) as avg_clarity
           FROM submissions
          WHERE task_id = $1 AND clarity_score IS NOT NULL`,
        [id]
      );
      const avgClarity = clarityAvg.rows[0]?.avg_clarity ? parseFloat(clarityAvg.rows[0].avg_clarity) : null;

      // Optionally, fetch assets per submission
      const ids = r.rows.map(row => row.id);
      let assetsBySubmission = {};
      if (ids.length) {
        const a = await pool.query(
          `SELECT id, submission_id, asset_type, file_name, mime_type, file_size, url, storage_key
             FROM submission_assets
            WHERE submission_id = ANY($1::uuid[])`,
          [ids]
        );
        for (const row of a.rows) {
          if (!assetsBySubmission[row.submission_id]) assetsBySubmission[row.submission_id] = [];
          assetsBySubmission[row.submission_id].push(row);
        }
      }

      const submissions = r.rows.map((row) => ({
        id: row.id,
        status: row.status,
        submitted_at: row.submitted_at,
        graded_at: row.graded_at,
        ai_score: row.ai_score,
        ai_feedback: row.ai_feedback,
        educator_score: row.educator_score,
        educator_feedback: row.educator_feedback,
        notes: row.notes,
        clarity_score: row.clarity_score,
        student: {
          name: row.name,
          email: row.email,
          picture: row.picture,
        },
        assets: assetsBySubmission[row.id] || [],
      }));

      return res.json({ ok: true, submissions, avg_clarity_score: avgClarity });
    } catch (e) {
      console.error('List submissions error:', e);
      return res.status(500).json({ ok: false, error: 'failed to list submissions' });
    }
  });

  return router;
};
