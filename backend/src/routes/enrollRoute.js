// backend/src/routes/enrollRoute.js
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

  // Enroll current user to a task via share slug
  router.post('/:slug', requireAuth, async (req, res) => {
    try {
      const userId = await getUserIdFromReq(req);
      const { slug } = req.params;

      const t = await pool.query(
        `SELECT id, task_title, status, share_enabled, share_slug
         FROM tasks
         WHERE share_slug = $1 AND status = 'published' AND share_enabled = true`,
        [slug]
      );
      if (t.rowCount === 0) return res.status(404).json({ ok: false, error: 'task not found or not shareable' });
      const task = t.rows[0];

      // Insert enrollment idempotently
      await pool.query(
        `INSERT INTO task_enrollments (task_id, user_id, role)
         VALUES ($1, $2, 'student')
         ON CONFLICT (task_id, user_id) DO NOTHING`,
        [task.id, userId]
      );

      console.log(`[Enroll] user ${userId} -> task ${task.id} (${task.task_title})`);
      return res.json({ ok: true, task: { id: task.id, title: task.task_title, slug: task.share_slug } });
    } catch (e) {
      console.error('Enroll error:', e);
      return res.status(500).json({ ok: false, error: 'failed to enroll' });
    }
  });

  // List tasks the current user has enrolled in
  router.get('/mine', requireAuth, async (req, res) => {
    try {
      const userId = await getUserIdFromReq(req);
      const r = await pool.query(
        `SELECT t.id, t.task_title, t.objective, t.due_at, t.level, t.academic_integrity
           FROM task_enrollments e
           JOIN tasks t ON t.id = e.task_id
          WHERE e.user_id = $1
          ORDER BY t.updated_at DESC`,
        [userId]
      );
      return res.json({ ok: true, tasks: r.rows });
    } catch (e) {
      console.error('List enrolled tasks error:', e);
      return res.status(500).json({ ok: false, error: 'failed to list enrolled tasks' });
    }
  });

  return router;
};
