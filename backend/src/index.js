require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const consultationRoutes = require('./routes/consultations');
const clientRoutes = require('./routes/clients');
const checkinRoutes = require('./routes/checkins');
const messageRoutes = require('./routes/messages');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/messages', messageRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Seed admin account on first boot
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Dom Sharpe';

  if (!email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, passwordHash, role: 'ADMIN', name },
  });
  console.log(`Admin account created: ${email}`);
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await seedAdmin();
  } catch (err) {
    console.error('seedAdmin failed (non-fatal):', err.message);
  }
});
