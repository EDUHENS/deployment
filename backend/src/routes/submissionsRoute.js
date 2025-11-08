// backend/src/routes/submissionsRoute.js
const express = require('express');
const { pool, userModel } = require('../database/index.js');

module.exports = (requireAuth) => {
  const router = express.Router();

  async function getUserIdFromReq(req) {
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
      const { task_id, assets } = req.body || {};
      if (!task_id) return res.status(400).json({ ok: false, error: 'missing task_id' });

      // If an existing draft for this task+student exists, return it
      const existing = await pool.query(
        `SELECT id FROM submissions WHERE task_id=$1 AND student_id=$2 AND status='draft' ORDER BY created_at DESC LIMIT 1`,
        [task_id, studentId]
      );
      let submissionId;
      if (existing.rowCount > 0) {
        submissionId = existing.rows[0].id;
      } else {
        const ins = await pool.query(
          `INSERT INTO submissions (task_id, student_id, status) VALUES ($1,$2,'draft') RETURNING id`,
          [task_id, studentId]
        );
        submissionId = ins.rows[0].id;
        console.log(`[Submissions] Draft created: ${submissionId} (task ${task_id}, student ${studentId})`);
      }

      // Optional assets insert
      if (Array.isArray(assets) && assets.length) {
        for (const a of assets) {
          await pool.query(
            `INSERT INTO submission_assets (submission_id, asset_type, file_name, mime_type, file_size, storage_key, url)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              submissionId,
              a.asset_type || null,
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
      const { assets, status } = req.body || {};

      const owns = await pool.query(`SELECT student_id, status FROM submissions WHERE id=$1`, [id]);
      if (owns.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      if (owns.rows[0].student_id !== studentId) return res.status(403).json({ ok: false, error: 'forbidden' });

      if (status && typeof status === 'string') {
        await pool.query(`UPDATE submissions SET status=$2, updated_at=now() WHERE id=$1`, [id, status]);
      } else {
        await pool.query(`UPDATE submissions SET updated_at=now() WHERE id=$1`, [id]);
      }

      if (Array.isArray(assets) && assets.length) {
        for (const a of assets) {
          await pool.query(
            `INSERT INTO submission_assets (submission_id, asset_type, file_name, mime_type, file_size, storage_key, url)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              id,
              a.asset_type || null,
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

  // Submit final (status -> submitted)
  router.post('/:id/submit', requireAuth, async (req, res) => {
    try {
      const studentId = await getUserIdFromReq(req);
      const { id } = req.params;
      const owns = await pool.query(`SELECT student_id FROM submissions WHERE id=$1`, [id]);
      if (owns.rowCount === 0) return res.status(404).json({ ok: false, error: 'submission not found' });
      if (owns.rows[0].student_id !== studentId) return res.status(403).json({ ok: false, error: 'forbidden' });

      await pool.query(
        `UPDATE submissions SET status='submitted', submitted_at=now(), updated_at=now() WHERE id=$1`,
        [id]
      );
      console.log(`[Submissions] Submitted: ${id}`);
      return res.json({ ok: true, status: 'submitted' });
    } catch (e) {
      console.error('Submit error:', e);
      return res.status(500).json({ ok: false, error: 'failed to submit' });
    }
  });

  return router;
};

