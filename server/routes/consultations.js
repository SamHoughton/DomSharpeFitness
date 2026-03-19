const express = require('express');
const { Resend } = require('resend');
const db = require('../db');
const { authMiddleware, domOnly } = require('../middleware/auth');

const router = express.Router();

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// POST /api/consultations — public (called from the main site form)
router.post('/', async (req, res) => {
  try {
    const { name, email, goal, experience, availability, message } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    if (name.length > 100 || email.length > 200) return res.status(400).json({ error: 'Input too long' });
    if (message && message.length > 2000) return res.status(400).json({ error: 'Message too long' });

    const { rows } = await db.query(
      `INSERT INTO consultations (name, email, goal, experience, availability, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name.trim(), email.toLowerCase().trim(), goal || null, experience || null, availability || null, message || null]
    );

    // Email Dom — fire and forget
    if (process.env.RESEND_API_KEY && process.env.DOM_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      resend.emails.send({
        from:    process.env.RESEND_FROM || 'onboarding@resend.dev',
        to:      process.env.DOM_EMAIL,
        subject: `New consultation request from ${esc(name)}`,
        html: `
          <h2>New Consultation Request</h2>
          <p><strong>Name:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
          <p><strong>Goal:</strong> ${esc(goal) || 'Not specified'}</p>
          <p><strong>Experience:</strong> ${esc(experience) || 'Not specified'}</p>
          <p><strong>Availability:</strong> ${esc(availability) || 'Not specified'}</p>
          <p><strong>Message:</strong> ${esc(message) || 'None'}</p>
        `
      }).catch(console.error);
    }

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/consultations — Dom only
router.get('/', authMiddleware, domOnly, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM consultations ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/consultations/:id — update status, Dom only
router.put('/:id', authMiddleware, domOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'converted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const { rows } = await db.query(
      'UPDATE consultations SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/consultations/:id — Dom only
router.delete('/:id', authMiddleware, domOnly, async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM consultations WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
