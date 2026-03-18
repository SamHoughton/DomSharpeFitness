const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const { authenticate, adminOnly } = require('../middleware/auth');

const prisma = new PrismaClient();
const getResend = () => new Resend(process.env.RESEND_API_KEY);

// GET /api/clients — admin: list all clients
router.get('/', authenticate, adminOnly, async (req, res) => {
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: {
      id: true, name: true, email: true, phone: true,
      goal: true, experience: true, createdAt: true,
      _count: { select: { checkIns: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(clients);
});

// POST /api/clients — admin: create client account
router.post('/', authenticate, adminOnly, async (req, res) => {
  const { name, email, phone, goal, experience } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

  // Generate a temporary password
  const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4).toUpperCase();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const client = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, role: 'CLIENT', phone, goal, experience },
    select: { id: true, name: true, email: true, phone: true, goal: true, experience: true, createdAt: true },
  });

  // Email welcome message with login details
  if (process.env.RESEND_API_KEY) {
    const portalUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/portal.html`
      : 'https://yoursite.netlify.app/portal.html';

    try {
      await getResend().emails.send({
        from: 'Dom Sharpe — Sharpe Strength <noreply@sharpestrength.co.uk>',
        to: email,
        subject: 'Your Sharpe Strength client portal is ready',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#C8923A">Welcome to Sharpe Strength, ${name}!</h2>
            <p>Dom has set up your personal client portal where you can log your weekly check-ins, track your progress, and message Dom directly.</p>
            <h3>Your login details</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;font-weight:bold;width:140px">Portal URL</td><td style="padding:8px"><a href="${portalUrl}">${portalUrl}</a></td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${email}</td></tr>
              <tr><td style="padding:8px;font-weight:bold">Password</td><td style="padding:8px">${tempPassword}</td></tr>
            </table>
            <p style="margin-top:16px;color:#666;font-size:13px">Please change your password after your first login.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Welcome email failed:', err.message);
    }
  }

  res.status(201).json({ client, tempPassword });
});

// GET /api/clients/:id — admin: get single client with recent check-ins
router.get('/:id', authenticate, adminOnly, async (req, res) => {
  const client = await prisma.user.findUnique({
    where: { id: req.params.id, role: 'CLIENT' },
    select: {
      id: true, name: true, email: true, phone: true,
      goal: true, experience: true, createdAt: true,
      checkIns: { orderBy: { weekDate: 'desc' } },
    },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

// PATCH /api/clients/:id — admin: update client details
router.patch('/:id', authenticate, adminOnly, async (req, res) => {
  const { name, phone, goal, experience } = req.body;
  const client = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, phone, goal, experience },
    select: { id: true, name: true, email: true, phone: true, goal: true, experience: true },
  });
  res.json(client);
});

// DELETE /api/clients/:id — admin: remove client
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id, role: 'CLIENT' } });
  res.json({ success: true });
});

// POST /api/clients/:id/reset-password — admin: reset a client's password
router.post('/:id/reset-password', authenticate, adminOnly, async (req, res) => {
  const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4).toUpperCase();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
  res.json({ newPassword });
});

module.exports = router;
