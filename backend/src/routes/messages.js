const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, adminOnly } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/messages/conversations — admin: list all client conversations with unread count
router.get('/conversations', authenticate, adminOnly, async (req, res) => {
  const adminId = req.user.id;

  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: { id: true, name: true, email: true },
  });

  const conversations = await Promise.all(
    clients.map(async (client) => {
      const latest = await prisma.message.findFirst({
        where: {
          OR: [
            { fromId: client.id, toId: adminId },
            { fromId: adminId, toId: client.id },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      const unread = await prisma.message.count({
        where: { fromId: client.id, toId: adminId, readAt: null },
      });

      return { client, latest, unread };
    })
  );

  // Sort by latest message time
  conversations.sort((a, b) => {
    if (!a.latest) return 1;
    if (!b.latest) return -1;
    return new Date(b.latest.createdAt) - new Date(a.latest.createdAt);
  });

  res.json(conversations);
});

// GET /api/messages/admin-thread — client: get own conversation with the admin
router.get('/admin-thread', authenticate, async (req, res) => {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) return res.json([]);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromId: req.user.id, toId: admin.id },
        { fromId: admin.id, toId: req.user.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: { from: { select: { id: true, name: true, role: true } } },
  });

  await prisma.message.updateMany({
    where: { fromId: admin.id, toId: req.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  res.json(messages);
});

// GET /api/messages/:userId — get conversation between current user and userId
router.get('/:userId', authenticate, async (req, res) => {
  const currentId = req.user.id;
  const otherId = req.params.userId;

  // Clients can only read their own conversation with admin
  if (req.user.role === 'CLIENT') {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin || otherId !== admin.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromId: currentId, toId: otherId },
        { fromId: otherId, toId: currentId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: { from: { select: { id: true, name: true, role: true } } },
  });

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { fromId: otherId, toId: currentId, readAt: null },
    data: { readAt: new Date() },
  });

  res.json(messages);
});

// POST /api/messages — send a message
router.post('/', authenticate, async (req, res) => {
  let { toId, toRole, body } = req.body;
  if (!body?.trim()) {
    return res.status(400).json({ error: 'body is required' });
  }

  // Allow clients to send to admin by role rather than ID
  if (!toId && toRole === 'ADMIN') {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    toId = admin.id;
  }

  if (!toId) return res.status(400).json({ error: 'toId or toRole is required' });

  // Clients can only message the admin
  if (req.user.role === 'CLIENT') {
    const target = await prisma.user.findUnique({ where: { id: toId } });
    if (!target || target.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Clients can only message the admin' });
    }
  }

  const message = await prisma.message.create({
    data: { fromId: req.user.id, toId, body: body.trim() },
    include: { from: { select: { id: true, name: true, role: true } } },
  });

  res.status(201).json(message);
});

// GET /api/messages/unread/count — client: get own unread count from admin
router.get('/unread/count', authenticate, async (req, res) => {
  const adminId = req.user.role === 'ADMIN' ? null :
    (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id;

  const where = req.user.role === 'ADMIN'
    ? { toId: req.user.id, readAt: null }
    : { fromId: adminId, toId: req.user.id, readAt: null };

  const count = await prisma.message.count({ where });
  res.json({ count });
});

module.exports = router;
