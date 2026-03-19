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

    const tempPassword = crypto.randomBytes(12).toString('hex'); // 24 hex chars, 96 bits entropy
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
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#111;border-top:3px solid #C8923A;padding:32px;text-align:center">
            <div style="font-size:22px;font-weight:800;letter-spacing:4px;color:#fff">SHARPE</div>
            <div style="font-size:13px;font-weight:600;letter-spacing:6px;color:#C8923A;margin-top:2px">STRENGTH</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#181818;padding:40px 32px">
            <p style="color:#C8923A;font-size:12px;font-weight:700;letter-spacing:3px;margin:0 0 16px">WELCOME TO THE TEAM</p>
            <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 24px;line-height:1.3">Hi ${rows[0].name},</h1>
            <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 24px">Dom has set up your personal client portal. Log in to track your progress, submit weekly check-ins, and message Dom directly.</p>

            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a2a2a;border-radius:8px;margin:0 0 32px">
              <tr><td style="padding:24px">
                <p style="color:#888;font-size:11px;font-weight:700;letter-spacing:2px;margin:0 0 16px">YOUR LOGIN DETAILS</p>
                <p style="margin:0 0 10px"><span style="color:#888;font-size:13px">Email</span><br><span style="color:#fff;font-size:15px;font-weight:600">${rows[0].email}</span></p>
                <p style="margin:0"><span style="color:#888;font-size:13px">Temporary Password</span><br><span style="color:#C8923A;font-size:18px;font-weight:700;letter-spacing:2px;font-family:monospace">${tempPassword}</span></p>
              </td></tr>
            </table>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
              <tr><td style="background:#C8923A;border-radius:4px">
                <a href="https://sharpestrength.com/portal.html" style="display:block;padding:14px 32px;color:#000;font-weight:800;font-size:14px;letter-spacing:2px;text-decoration:none">ACCESS YOUR PORTAL →</a>
              </td></tr>
            </table>

            <p style="color:#666;font-size:13px;line-height:1.6;margin:0">Change your password after your first login. If you have any questions, just reply to this email or message Dom through the portal.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111;padding:24px 32px;text-align:center;border-top:1px solid #222">
            <p style="color:#444;font-size:12px;margin:0">Sharpe Strength · Bannatyne Fairfield, Hitchin</p>
            <p style="margin:6px 0 0"><a href="https://sharpestrength.com" style="color:#C8923A;font-size:12px;text-decoration:none">sharpestrength.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
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
