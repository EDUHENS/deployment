// backend/src/routes/submissionsRoute.js
const express = require('express');
const { pool, userModel } = require('../database/index.js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

module.exports = (requireAuth) => {
  const router = express.Router();
  const uploadRoot = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadRoot)) {
    try { fs.mkdirSync(uploadRoot, { recursive: true }); } catch {}
  }
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const subId = req.params.id || 'misc';
      const dir = path.join(uploadRoot, subId);
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // keep original name; if collision, multer will overwrite; add timestamp to be safe
      const base = Date.now() + '-' + (file.originalname || 'file');
      cb(null, base);
    }
  });
  const upload = multer({ storage });

  async function getUserIdFromReq(req) {
    const claims = req?.auth?.payload || {};
    const sub = claims?.sub;
    if (!sub) throw new Error('no auth sub');
    let u = await userModel.findByAuth0Id(sub);
    if (!u) {
      // Best-effort sync like /api/auth/me
      try {
        const authz = req.headers?.authorization || '';
        const m = authz.match(/Bearer\s+(.+)/i);
        const token = m ? m[1] : null;
        const domain = (process.env.AUTH0_DOMAIN || '').trim();
        let email = claims.email;
        let given_name = claims.given_name;
        let family_name = claims.family_name;
        let picture = claims.picture;
        let nickname = claims.nickname;
        if ((!email || !given_name || !family_name) && token && domain) {
          try {
            const resp = await fetch(`https://${domain}/userinfo`, { headers: { Authorization: `Bearer ${token}` } });
            if (resp.ok) {
              const info = await resp.json();
              email = info.email || email;
              given_name = info.given_name || given_name;
              family_name = info.family_name || family_name;
              picture = info.picture || picture;
              nickname = info.nickname || nickname;
            }
          } catch {}
        }
        if (email) {
          await userModel.createOrUpdateAuth0User({
            sub,
            email,
            email_verified: claims.email_verified || false,
            given_name,
            family_name,
            picture,
            nickname,
          });
          u = await userModel.findByAuth0Id(sub);
        }
      } catch {}
    }
    if (!u) throw new Error('user not found');
    return u.id;
  }

  async function getTeacherIdFromReq(req) {
    const sub = req?.auth?.payload?.sub;
    if (!sub) throw new Error('no auth sub');
    const u = await userModel.findByAuth0Id(sub);
    if (!u) throw new Error('user not found');
    return u.id;
  }

  // Create a draft submission (idempotent by returning existing draft if present)
  router.post('/', requireAuth, async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { task_id, assets, notes } = req.body || {};
      if (!task_id) return res.status(400).json({ ok: false, error: 'missing task_id' });

      // Reuse latest submission (draft or submitted) to avoid duplicates per task+student
      const existing = await pool.query(
        `SELECT id, status FROM submissions WHERE task_id=$1 AND student_id=$2 ORDER BY created_at DESC LIMIT 1`,
        [task_id, studentId]
      );
      let submissionId;
      if (existing.rowCount > 0) {
        submissionId = existing.rows[0].id;
        if (typeof notes === 'string') {
          await pool.query(`UPDATE submissions SET notes=$2, updated_at=now() WHERE id=$1`, [submissionId, notes]);
        }
      } else {
        const ins = await pool.query(
          `INSERT INTO submissions (task_id, student_id, status, notes) VALUES ($1,$2,'draft',$3) RETURNING id`,
          [task_id, studentId, typeof notes === 'string' ? notes : null]
        );
        submissionId = ins.rows[0].id;
        console.log(`[Submissions] Draft created: ${submissionId} (task ${task_id}, student ${studentId})`);
      }

      // Optional assets insert (dedupe against existing)
      if (Array.isArray(assets) && assets.length) {
        const exist = await pool.query(
          `SELECT asset_type, url, storage_key, file_name, mime_type FROM submission_assets WHERE submission_id=$1`,
          [submissionId]
        );
        const hasLink = new Set(
          exist.rows.filter(r => (r.asset_type || '') === 'link' && r.url).map(r => r.url)
        );
        const hasStorage = new Set(
          exist.rows.filter(r => (r.asset_type || '') === 'file' && r.storage_key).map(r => r.storage_key)
        );
        const hasFileSig = new Set(
          exist.rows
            .filter(r => (r.asset_type || '') === 'file' && !r.storage_key)
            .map(r => `${r.file_name || ''}|${r.mime_type || ''}`)
        );
        for (const a of assets) {
          const type = a.asset_type || null;
          if (type === 'link' && a.url) {
            if (hasLink.has(a.url)) continue;
            hasLink.add(a.url);
          } else if (type === 'file') {
            if (a.storage_key) {
              if (hasStorage.has(a.storage_key)) continue;
              hasStorage.add(a.storage_key);
            } else {
              const sig = `${a.file_name || ''}|${a.mime_type || ''}`;
              if (hasFileSig.has(sig)) continue;
              hasFileSig.add(sig);
            }
          }
          await pool.query(
            `INSERT INTO submission_assets (submission_id, asset_type, file_name, mime_type, file_size, storage_key, url)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              submissionId,
              type,
              a.file_name || null,
              a.mime_type || null,
              a.file_size || null,
              a.storage_key || null,
              a.url || null,
            ]
          );
        }
      }

      return res.json({ ok: true, submission_id: submissionId, status: 'draft' });
    } catch (e) {
      console.error('Create draft submission error:', e);
      return res.status(500).json({ ok: false, error: 'failed to create draft submission' });
    }
  });

  // Update a draft (e.g., add more assets). Only owner can update.
  router.put('/:id', requireAuth, async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { id } = req.params;
      const { assets, status, notes } = req.body || {};

      const owns = await pool.query(`SELECT student_id, status FROM submissions WHERE id=$1`, [id]);
      if (owns.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      if (owns.rows[0].student_id !== studentId) return res.status(403).json({ ok: false, error: 'forbidden' });

      const fields = [];
      const params = [id];
      if (status && typeof status === 'string') { fields.push(`status=$${params.length+1}`); params.push(status); }
      if (typeof notes === 'string') { fields.push(`notes=$${params.length+1}`); params.push(notes); }
      if (fields.length) {
        await pool.query(`UPDATE submissions SET ${fields.join(', ')}, updated_at=now() WHERE id=$1`, params);
      } else {
        await pool.query(`UPDATE submissions SET updated_at=now() WHERE id=$1`, [id]);
      }

      if (Array.isArray(assets) && assets.length) {
        const exist = await pool.query(
          `SELECT asset_type, url, storage_key, file_name, mime_type FROM submission_assets WHERE submission_id=$1`,
          [id]
        );
        const hasLink = new Set(
          exist.rows.filter(r => (r.asset_type || '') === 'link' && r.url).map(r => r.url)
        );
        const hasStorage = new Set(
          exist.rows.filter(r => (r.asset_type || '') === 'file' && r.storage_key).map(r => r.storage_key)
        );
        const hasFileSig = new Set(
          exist.rows
            .filter(r => (r.asset_type || '') === 'file' && !r.storage_key)
            .map(r => `${r.file_name || ''}|${r.mime_type || ''}`)
        );
        for (const a of assets) {
          const type = a.asset_type || null;
          if (type === 'link' && a.url) {
            if (hasLink.has(a.url)) continue;
            hasLink.add(a.url);
          } else if (type === 'file') {
            if (a.storage_key) {
              if (hasStorage.has(a.storage_key)) continue;
              hasStorage.add(a.storage_key);
            } else {
              const sig = `${a.file_name || ''}|${a.mime_type || ''}`;
              if (hasFileSig.has(sig)) continue;
              hasFileSig.add(sig);
            }
          }
          await pool.query(
            `INSERT INTO submission_assets (submission_id, asset_type, file_name, mime_type, file_size, storage_key, url)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              id,
              type,
              a.file_name || null,
              a.mime_type || null,
              a.file_size || null,
              a.storage_key || null,
              a.url || null,
            ]
          );
        }
      }

      return res.json({ ok: true });
    } catch (e) {
      console.error('Update draft submission error:', e);
      return res.status(500).json({ ok: false, error: 'failed to update submission' });
    }
  });

  // Get my latest submission for a task (student view)
  router.get('/mine', requireAuth, async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store');
      const rawAuth = req.headers?.authorization || '';
      console.log('[API /submissions/mine] auth header present:', rawAuth ? 'yes' : 'no', 'task_id=', req.query?.task_id);
      if (rawAuth) console.log('[API /submissions/mine] Authorization (first 16):', rawAuth.substring(0, 16) + '...');
      const studentId = await getUserIdFromReq(req);
      const { task_id } = req.query || {};
      if (!task_id) return res.status(400).json({ ok: false, error: 'missing task_id' });

      const s = await pool.query(
        `SELECT id, status, updated_at, submitted_at, graded_at, notes, ai_score, ai_feedback
           FROM submissions
          WHERE task_id=$1 AND student_id=$2
          ORDER BY updated_at DESC
          LIMIT 1`,
        [task_id, studentId]
      );
      if (s.rowCount === 0) return res.json({ ok: true, submission: null });

      const sub = s.rows[0];
      const a = await pool.query(
        `SELECT id, asset_type, file_name, mime_type, file_size, storage_key, url
           FROM submission_assets WHERE submission_id=$1 ORDER BY created_at ASC`,
        [sub.id]
      );
      const parsed = parseAiFeedback(sub.ai_feedback);
      console.log('[API /submissions/mine] result id=', sub.id, 'status=', sub.status, 'ai_score=', sub.ai_score, 'ai_present=', !!sub.ai_feedback);
      return res.json({
        ok: true,
        submission: {
          id: sub.id,
          status: sub.status,
          updated_at: sub.updated_at,
          submitted_at: sub.submitted_at,
          graded_at: sub.graded_at,
          notes: sub.notes,
          ai_score: sub.ai_score,
          ai_feedback: sub.ai_feedback,
          ai_overall: parsed.overall || null,
          ai_summary: parsed.summary || null,
          ai_criteria: parsed.criteria || null,
          assets: a.rows,
        }
      });
    } catch (e) {
      console.error('Get my submission error:', e);
      return res.status(500).json({ ok: false, error: 'failed to load submission' });
    }
  });

  async function buildAiTaskForTask(taskId) {
    // replicate logic from tasksRoute to craft ai_task from DB
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

  async function buildSubmissionArtefacts(submissionId) {
    const a = await pool.query(
      `SELECT asset_type, file_name, url FROM submission_assets WHERE submission_id=$1`,
      [submissionId]
    );
    const links = a.rows.filter(r => (r.url || '').startsWith('http')).map(r => r.url);
    const files = a.rows.filter(r => !r.url && r.file_name).map(r => r.file_name);
    return { links, files };
  }

  async function tryAutoGrade(submissionId) {
    try {
      const s = await pool.query(`SELECT task_id, student_id, notes FROM submissions WHERE id=$1`, [submissionId]);
      if (s.rowCount === 0) return;
      const taskId = s.rows[0].task_id;
      const ai_task = await buildAiTaskForTask(taskId);
      if (!ai_task) return;
      const artefacts = await buildSubmissionArtefacts(submissionId);
      const submission = { links: artefacts.links, files: artefacts.files, notes: s.rows[0]?.notes || '' };

      // --- Begin: Enrich with GitHub/raw contents so model can see student work ---
      async function normalizeGitHubLinkToRawCandidates(link) {
        try {
          const url = new URL(link);
          const host = url.hostname.toLowerCase();
          const path = url.pathname.replace(/\/+/, '/');

          // Already a raw link
          if (host === 'raw.githubusercontent.com') {
            return [{ url: link, label: path }];
          }

          if (host === 'github.com') {
            const parts = path.split('/').filter(Boolean); // [owner, repo, type, ref, ...rest]
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
              // Try README and a few common entry files in subpath (if any) and root
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
        return [];
      }

      async function fetchTextIfSmall(url, abortSignal) {
        try {
          const resp = await fetch(url, { signal: abortSignal, headers: {} });
          if (!resp.ok) return null;
          const ct = resp.headers.get('content-type') || '';
          if (!ct.includes('text') && !ct.includes('markdown') && !ct.includes('json') && !ct.includes('html')) return null;
          const buf = await resp.arrayBuffer();
          if (buf.byteLength > 200_000) return null; // skip very large files
          const txt = Buffer.from(buf).toString('utf8');
          return txt;
        } catch { return null; }
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

      const fetched = await buildFetchedContents(submission.links || []);
      const fetchedBlock = fetched.length
        ? ('\nFetched file contents (truncated):\n' + fetched.map(it => `---\n${it.label}\n${it.content}`).join('\n') + '\n---\n')
        : '\n[No readable file contents fetched from links]\n';
      // --- End: enrichment ---

      // Build prompt (reuse logic from submissionsAiRoute)
      const system = 'You are a strict but fair educator assessing a student submission. Always grade against the provided rubric and criteria only. If evidence is missing or links are inaccessible, say so and grade conservatively. Return JSON only.';
      const rubric = Array.isArray(ai_task.rubric) ? ai_task.rubric : [];
      const toRows = (r) => (Array.isArray(r) ? r.map(row => (Array.isArray(row) ? row.join(' | ') : String(row))).join('\n') : 'No rubric provided.');
      const user = [
        `Task Title: ${ai_task.title}`,
        `Objective: ${ai_task.objective}`,
        '',
        'Assessment Criteria:',
        (ai_task.assessment_criteria || []).map(c => `- ${c}`).join('\n') || 'N/A',
        '',
        'Rubric matrix (first row headers):',
        toRows(rubric),
        '',
        'Student artefacts:',
        `Links: ${submission.links.join(', ') || 'None'}`,
        `Files: ${submission.files.join(', ') || 'None'}`,
        `Note: ${submission.notes || 'None'}`,
        '',
        'Instructions: For each criterion choose one level (use rubric headers), give a 1-2 sentence justification with evidence. Provide improvements. Decide overall pass|fail. Output JSON: { overall, criteria:[{name,level,comment,improvement}], summary, evidence_checked }.',
        fetchedBlock
      ].join('\n');

      // If OpenAI key present, call model; else store prompt as ai_feedback with pending tag
      if (process.env.OPENAI_API_KEY && process.env.AI_AUTOGRADE === '1') {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user }
            ],
            temperature: 0.2
          })
        });
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || '';
        // try parse JSON from content
        let overall = null;
        try {
          let cleaned = content.trim();
          // strip markdown fences if present
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
          const parsed = JSON.parse(cleaned);
          overall = parsed?.overall;
        } catch {}
        const ai_score = overall === 'pass' ? 1 : overall === 'fail' ? 0 : null;
        await pool.query(
          `UPDATE submissions SET ai_feedback=$2, ai_score=$3, updated_at=now() WHERE id=$1`,
          [submissionId, content || '[no-content]', ai_score]
        );
      } else {
        const placeholder = JSON.stringify({ status: 'PENDING_AUTOGRADE', system, user });
        await pool.query(
          `UPDATE submissions SET ai_feedback=$2, updated_at=now() WHERE id=$1`,
          [submissionId, placeholder]
        );
      }
    } catch (err) {
      console.warn('Auto-grade failed:', err?.message || err);
    }
  }

  // Submit final (status -> submitted)
  router.post('/:id/submit', requireAuth, async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { id } = req.params;
      const owns = await pool.query(`SELECT student_id FROM submissions WHERE id=$1`, [id]);
      if (owns.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      if (owns.rows[0].student_id !== studentId) return res.status(403).json({ ok: false, error: 'forbidden' });

      await pool.query(
        `UPDATE submissions SET status='submitted', submitted_at=now(), updated_at=now(), ai_feedback=NULL, ai_score=NULL WHERE id=$1`,
        [id]
      );
      console.log(`[Submissions] Submitted: ${id}`);
      // Trigger AI auto-grade (best-effort)
      tryAutoGrade(id).catch(() => {});
      return res.json({ ok: true, status: 'submitted' });
    } catch (e) {
      console.error('Submit error:', e);
      return res.status(500).json({ ok: false, error: 'failed to submit' });
    }
  });

  // Teacher grading (educator_score/feedback and set status to graded)
  router.patch('/:id/grade', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { educator_score, educator_feedback, status } = req.body || {};
      const teacherId = await getTeacherIdFromReq(req);

      // Ensure this teacher owns the task belonging to the submission
      const owns = await pool.query(
        `SELECT s.task_id, t.teacher_id
           FROM submissions s
           JOIN tasks t ON t.id = s.task_id
          WHERE s.id = $1`,
        [id]
      );
      if (owns.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      if (owns.rows[0].teacher_id !== teacherId) return res.status(403).json({ ok: false, error: 'forbidden' });

      const newStatus = typeof status === 'string' ? status : 'graded';
      await pool.query(
        `UPDATE submissions
            SET educator_score = COALESCE($2, educator_score),
                educator_feedback = COALESCE($3, educator_feedback),
                status = $4,
                graded_at = now(),
                updated_at = now()
          WHERE id = $1`,
        [id, educator_score ?? null, educator_feedback ?? null, newStatus]
      );
      return res.json({ ok: true });
    } catch (e) {
      console.error('Grade submission error:', e);
      return res.status(500).json({ ok: false, error: 'failed to grade submission' });
    }
  });

  // Delete a single asset by id (owner only)
  router.delete('/:id/assets/:assetId', requireAuth, async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { id, assetId } = req.params;
      const owns = await pool.query(`SELECT student_id FROM submissions WHERE id=$1`, [id]);
      if (owns.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      if (owns.rows[0].student_id !== studentId) return res.status(403).json({ ok: false, error: 'forbidden' });

      const del = await pool.query(`DELETE FROM submission_assets WHERE id=$1 AND submission_id=$2 RETURNING id`, [assetId, id]);
      if (del.rowCount === 0) return res.status(404).json({ ok: false, error: 'asset not found' });
      await pool.query('UPDATE submissions SET updated_at=now() WHERE id=$1', [id]);
      return res.json({ ok: true });
    } catch (e) {
      console.error('Delete asset error:', e);
      return res.status(500).json({ ok: false, error: 'failed to delete asset' });
    }
  });

  // Upload one or more files for a submission (student must own it)
  router.post('/:id/assets/upload', requireAuth, upload.array('files', 10), async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { id } = req.params;
      const owns = await pool.query('SELECT student_id FROM submissions WHERE id=$1', [id]);
      if (owns.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      if (owns.rows[0].student_id !== studentId) return res.status(403).json({ ok: false, error: 'forbidden' });

      const files = Array.isArray(req.files) ? req.files : [];
      const exist = await pool.query(
        `SELECT storage_key, file_name FROM submission_assets WHERE submission_id=$1 AND asset_type='file'`,
        [id]
      );
      const hasStorage = new Set(exist.rows.filter(r => r.storage_key).map(r => r.storage_key));
      const hasName = new Set(exist.rows.filter(r => !r.storage_key && r.file_name).map(r => r.file_name));
      const saved = [];
      for (const f of files) {
        const fileName = f.originalname || f.filename;
        const storageKey = path.relative(process.cwd(), f.path).replaceAll('\\','/');
        if (hasStorage.has(storageKey) || hasName.has(fileName)) continue;
        await pool.query(
          `INSERT INTO submission_assets (submission_id, asset_type, file_name, mime_type, file_size, storage_key)
           VALUES ($1,'file',$2,$3,$4,$5)`,
          [id, fileName, f.mimetype || null, f.size || null, storageKey]
        );
        saved.push({ file_name: fileName, mime_type: f.mimetype, file_size: f.size, storage_key: storageKey });
      }
      await pool.query('UPDATE submissions SET updated_at=now() WHERE id=$1', [id]);
      return res.json({ ok: true, assets: saved });
    } catch (e) {
      console.error('Upload assets error:', e);
      return res.status(500).json({ ok: false, error: 'failed to upload files' });
    }
  });

  // Download a file asset from a submission (owner student or task's teacher)
  router.get('/:id/assets/:assetId/download', requireAuth, async (req, res) => {
    try {
      const { id, assetId } = req.params;
      // Who is calling
      const currentUserId = await getUserIdFromReq(req);

      // Check submission ownership and teacher access
      const subMeta = await pool.query(
        `SELECT s.student_id, s.task_id, t.teacher_id
           FROM submissions s
           JOIN tasks t ON t.id = s.task_id
          WHERE s.id = $1`,
        [id]
      );
      if (subMeta.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      const { student_id, teacher_id } = subMeta.rows[0];
      if (currentUserId !== student_id && currentUserId !== teacher_id) {
        return res.status(403).json({ ok: false, error: 'forbidden' });
      }

      // Load asset and verify it belongs to submission
      const a = await pool.query(
        `SELECT id, submission_id, asset_type, file_name, mime_type, storage_key
           FROM submission_assets WHERE id=$1 AND submission_id=$2`,
        [assetId, id]
      );
      if (a.rowCount === 0) return res.status(404).json({ ok: false, error: 'asset not found' });
      const asset = a.rows[0];
      if (!asset.storage_key) return res.status(400).json({ ok: false, error: 'no file on server for this asset' });

      const fileAbs = path.resolve(process.cwd(), asset.storage_key);
      // Safety: only serve from uploads/
      const isUnderUploads = fileAbs.startsWith(uploadRoot + path.sep) || fileAbs === uploadRoot;
      if (!isUnderUploads) return res.status(400).json({ ok: false, error: 'invalid path' });
      if (!fs.existsSync(fileAbs)) return res.status(404).json({ ok: false, error: 'file missing' });

      const filename = asset.file_name || path.basename(fileAbs);
      res.setHeader('Content-Type', asset.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '\"')}"`);
      return res.sendFile(fileAbs);
    } catch (e) {
      console.error('Download asset error:', e);
      return res.status(500).json({ ok: false, error: 'failed to download asset' });
    }
  });

  // Diagnostic: latest AI result for current student by task
  // GET /api/submissions/ai/latest?task_id=<UUID>
  router.get('/ai/latest', requireAuth, async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { task_id } = req.query || {};
      if (!task_id) return res.status(400).json({ ok: false, error: 'missing task_id' });

      const q = await pool.query(
        `SELECT id, status, updated_at, submitted_at, graded_at, ai_score, ai_feedback
           FROM submissions
          WHERE task_id=$1 AND student_id=$2
          ORDER BY COALESCE(submitted_at, updated_at) DESC
          LIMIT 1`,
        [task_id, studentId]
      );
      if (q.rowCount === 0) return res.json({ ok: true, submission: null });
      const row = q.rows[0];
      const parsed = parseAiFeedback(row.ai_feedback);
      res.set('Cache-Control', 'no-store');
      console.log('[API /submissions/ai/latest] id=', row.id, 'status=', row.status, 'ai_score=', row.ai_score, 'ai_present=', !!row.ai_feedback);
      return res.json({
        ok: true,
        submission: {
          id: row.id,
          status: row.status,
          updated_at: row.updated_at,
          submitted_at: row.submitted_at,
          graded_at: row.graded_at,
          ai_present: !!row.ai_feedback,
          ai_score: row.ai_score,
          ai_overall: parsed.overall || null,
          ai_summary: parsed.summary || null,
          ai_criteria: parsed.criteria || null,
          ai_feedback_raw: row.ai_feedback || null,
        }
      });
    } catch (e) {
      console.error('Latest AI fetch error:', e);
      return res.status(500).json({ ok: false, error: 'failed to load latest AI result' });
    }
  });

  // Diagnostic: AI result by submission id (owner only)
  // GET /api/submissions/:id/ai
  router.get('/:id/ai', requireAuth, async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { id } = req.params;
      const q = await pool.query(
        `SELECT id, student_id, status, updated_at, submitted_at, graded_at, ai_score, ai_feedback
           FROM submissions
          WHERE id=$1`,
        [id]
      );
      if (q.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      const row = q.rows[0];
      if (row.student_id !== studentId) return res.status(403).json({ ok: false, error: 'forbidden' });
      const parsed = parseAiFeedback(row.ai_feedback);
      res.set('Cache-Control', 'no-store');
      console.log('[API /submissions/:id/ai] id=', row.id, 'status=', row.status, 'ai_score=', row.ai_score, 'ai_present=', !!row.ai_feedback);
      return res.json({
        ok: true,
        submission: {
          id: row.id,
          status: row.status,
          updated_at: row.updated_at,
          submitted_at: row.submitted_at,
          graded_at: row.graded_at,
          ai_present: !!row.ai_feedback,
          ai_score: row.ai_score,
          ai_overall: parsed.overall || null,
          ai_summary: parsed.summary || null,
          ai_criteria: parsed.criteria || null,
          ai_feedback_raw: row.ai_feedback || null,
        }
      });
    } catch (e) {
      console.error('AI by id fetch error:', e);
      return res.status(500).json({ ok: false, error: 'failed to load AI result' });
    }
  });

  return router;
};
  function parseAiFeedback(content) {
    try {
      if (!content || typeof content !== 'string') return {};
      let cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
      const j = JSON.parse(cleaned);
      const overall = typeof j.overall === 'string' ? j.overall.toLowerCase() : undefined;
      const summary = typeof j.summary === 'string' ? j.summary : undefined;
      const criteria = Array.isArray(j.criteria) ? j.criteria : undefined;
      return { overall, summary, criteria };
    } catch { return {}; }
  }
