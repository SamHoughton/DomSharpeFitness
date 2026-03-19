const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations — Dom only, list of clients with messages
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    if (!req.user.is_dom) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await db.query(`
      SELECT p.id, p.name, p.email,
        COUNT(m.id) FILTER (WHERE m.sender = 'client' AND m.read_at IS NULL)::int AS unread,
        MAX(m.created_at) AS last_message
      FROM profiles p
      JOIN messages m ON m.profile_id = p.id
      WHERE p.is_dom = FALSE
      GROUP BY p.id
      ORDER BY last_message DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages/unread/count — Dom only
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    if (!req.user.is_dom) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count FROM messages WHERE sender = 'client' AND read_at IS NULL`
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages
//   Client → own thread (marks Dom's messages as read)
//   Dom    → ?clientId=UUID  (marks client's messages as read)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.is_dom) {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: 'clientId required' });

      const { rows } = await db.query(
        'SELECT * FROM messages WHERE profile_id = $1 ORDER BY created_at ASC',
        [clientId]
      );
      await db.query(
        `UPDATE messages SET read_at = NOW()
         WHERE profile_id = $1 AND sender = 'client' AND read_at IS NULL`,
        [clientId]
      );
      return res.json(rows);
    }

    const { rows } = await db.query(
      'SELECT * FROM messages WHERE profile_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    await db.query(
      `UPDATE messages SET read_at = NOW()
       WHERE profile_id = $1 AND sender = 'dom' AND read_at IS NULL`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { body, clientId } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Message body required' });

    const sender     = req.user.is_dom ? 'dom' : 'client';
    const profile_id = req.user.is_dom ? clientId : req.user.id;

    if (!profile_id) return res.status(400).json({ error: 'clientId required' });

    const { rows } = await db.query(
      'INSERT INTO messages (profile_id, sender, body) VALUES ($1, $2, $3) RETURNING *',
      [profile_id, sender, body.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
