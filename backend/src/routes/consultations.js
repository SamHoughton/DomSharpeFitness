const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const { authenticate, adminOnly } = require('../middleware/auth');

const prisma = new PrismaClient();
const getResend = () => new Resend(process.env.RESEND_API_KEY);

// POST /api/consultations — public, submit enquiry form
router.post('/', async (req, res) => {
  const { name, email, phone, goal, experience, availability, message } = req.body;

  if (!name || !email || !goal || !experience) {
    return res.status(400).json({ error: 'Name, email, goal and experience are required' });
  }

  const consultation = await prisma.consultation.create({
    data: { name, email: email.toLowerCase(), phone, goal, experience, availability, message },
  });

  // Email notification to Dom
  if (process.env.RESEND_API_KEY && process.env.DOM_EMAIL) {
    try {
      await getResend().emails.send({
        from: 'Sharpe Strength Website <noreply@sharpestrength.co.uk>',
        to: process.env.DOM_EMAIL,
        subject: `New consultation enquiry — ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#C8923A">New Consultation Enquiry</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;font-weight:bold;width:140px">Name</td><td style="padding:8px">${name}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${phone || '—'}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Goal</td><td style="padding:8px">${goal}</td></tr>
              <tr><td style="padding:8px;font-weight:bold">Experience</td><td style="padding:8px">${experience}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Availability</td><td style="padding:8px">${availability || '—'}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Message</td><td style="padding:8px">${message || '—'}</td></tr>
            </table>
            <p style="margin-top:24px;color:#666;font-size:13px">Submitted ${new Date().toLocaleString('en-GB')}</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Email send failed:', err.message);
    }
  }

  res.status(201).json({ success: true, id: consultation.id });
});

// GET /api/consultations — admin: list all
router.get('/', authenticate, adminOnly, async (req, res) => {
  const { status } = req.query;
  const consultations = await prisma.consultation.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json(consultations);
});

// PATCH /api/consultations/:id — admin: update status
router.patch('/:id', authenticate, adminOnly, async (req, res) => {
  const { status } = req.body;
  const valid = ['NEW', 'CONTACTED', 'CONVERTED'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
  }

  const consultation = await prisma.consultation.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(consultation);
});

module.exports = router;
