const express = require('express');
const db = require('../db');
const { authMiddleware, domOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/clients — all clients with stats, Dom only
router.get('/', authMiddleware, domOnly, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        p.id, p.email, p.name, p.goal, p.experience, p.created_at,
        COUNT(DISTINCT c.id)::int                                                        AS check_in_count,
        COUNT(DISTINCT m.id) FILTER (WHERE m.sender = 'client' AND m.read_at IS NULL)::int AS unread_count,
        MAX(c.week_date)                                                                 AS last_check_in
      FROM profiles p
      LEFT JOIN check_ins c ON c.profile_id = p.id
      LEFT JOIN messages  m ON m.profile_id = p.id
      WHERE p.is_dom = FALSE
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/clients/:id — single client, Dom only
router.get('/:id', authMiddleware, domOnly, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, name, goal, experience, created_at FROM profiles WHERE id = $1 AND is_dom = FALSE',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:id — remove client, Dom only
router.delete('/:id', authMiddleware, domOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM profiles WHERE id = $1 AND is_dom = FALSE', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
