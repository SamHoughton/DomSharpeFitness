const express = require('express');
const bcrypt  = require('bcrypt');
const crypto  = require('crypto');
const { Resend } = require('resend');
const db = require('../db');
const { authMiddleware, domOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/clients — create a client account, Dom only
router.post('/', authMiddleware, domOnly, async (req, res) => {
  try {
    const { name, email, goal, experience } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

    const tempPassword = crypto.randomBytes(5).toString('hex'); // e.g. "a3f9c2e1b4"
    const hash = await bcrypt.hash(tempPassword, 10);

    const { rows } = await db.query(
      `INSERT INTO profiles (email, name, password_hash, goal, experience)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, goal, experience, created_at`,
      [email.toLowerCase().trim(), name.trim(), hash, goal || null, experience || null]
    );

    // Send welcome email to client
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      resend.emails.send({
        from: process.env.RESEND_FROM,
        to: rows[0].email,
        subject: 'Welcome to Sharpe Strength — your login details',
        html: `
          <h2>Welcome to Sharpe Strength, ${rows[0].name}!</h2>
          <p>Dom has set up your client portal. Here are your login details:</p>
          <p><strong>Login page:</strong> <a href="https://sharpestrength.com/portal.html">sharpestrength.com/portal.html</a></p>
          <p><strong>Email:</strong> ${rows[0].email}</p>
          <p><strong>Temporary password:</strong> <code>${tempPassword}</code></p>
          <p>Please log in and change your password as soon as possible.</p>
          <p>— Dom Sharpe</p>
        `
      }).catch(console.error);
    }

    res.status(201).json({ client: rows[0], tempPassword });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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
