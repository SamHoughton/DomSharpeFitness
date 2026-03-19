const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { authMiddleware, domOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login — any user (Dom or client)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (email.length > 200 || password.length > 200) return res.status(400).json({ error: 'Input too long' });

    const { rows } = await db.query('SELECT * FROM profiles WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, is_dom: user.is_dom },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, is_dom: user.is_dom }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register — Dom only, creates a client account
router.post('/register', authMiddleware, domOnly, async (req, res) => {
  try {
    const { email, name, password, goal, experience } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'email, name, and password are required' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO profiles (email, name, password_hash, goal, experience)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, goal, experience, created_at`,
      [email.toLowerCase().trim(), name.trim(), hash, goal || null, experience || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/setup-dom — one-time: creates Dom's account (disabled once is_dom row exists)
router.post('/setup-dom', async (req, res) => {
  try {
    const { email, name, password, secret } = req.body;
    if (secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: 'Forbidden' });

    const existing = await db.query('SELECT id FROM profiles WHERE is_dom = TRUE');
    if (existing.rows.length) return res.status(409).json({ error: 'Dom account already exists' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO profiles (email, name, password_hash, is_dom)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, email, name, is_dom`,
      [email.toLowerCase().trim(), name.trim(), hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, name, goal, experience, is_dom, created_at FROM profiles WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
