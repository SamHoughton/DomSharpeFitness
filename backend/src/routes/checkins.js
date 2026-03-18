const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const { authenticate, adminOnly } = require('../middleware/auth');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'sharpe-strength/checkins', public_id: filename, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    ).end(buffer);
  });
}

// GET /api/checkins — own check-ins (client) or by clientId (admin)
router.get('/', authenticate, async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const clientId = isAdmin ? (req.query.clientId || undefined) : req.user.id;

  const checkins = await prisma.checkIn.findMany({
    where: clientId ? { clientId } : undefined,
    include: isAdmin ? { client: { select: { id: true, name: true, email: true } } } : undefined,
    orderBy: { weekDate: 'desc' },
  });
  res.json(checkins);
});

// POST /api/checkins — submit a check-in (client submits own; admin can specify clientId)
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const clientId = isAdmin && req.body.clientId ? req.body.clientId : req.user.id;

  // Clients can only submit for themselves
  if (!isAdmin && clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const {
    weekDate, weightKg, bodyFatPct,
    waistCm, hipsCm, chestCm, armsCm, thighsCm, notes,
  } = req.body;

  if (!weekDate) return res.status(400).json({ error: 'weekDate is required' });

  let photoUrl = null;
  if (req.file && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const filename = `checkin-${clientId}-${Date.now()}`;
      photoUrl = await uploadToCloudinary(req.file.buffer, filename);
    } catch (err) {
      console.error('Photo upload failed:', err.message);
    }
  }

  const parseNum = (v) => (v !== undefined && v !== '' ? parseFloat(v) : null);

  const checkin = await prisma.checkIn.create({
    data: {
      clientId,
      weekDate: new Date(weekDate),
      weightKg: parseNum(weightKg),
      bodyFatPct: parseNum(bodyFatPct),
      waistCm: parseNum(waistCm),
      hipsCm: parseNum(hipsCm),
      chestCm: parseNum(chestCm),
      armsCm: parseNum(armsCm),
      thighsCm: parseNum(thighsCm),
      notes: notes || null,
      photoUrl,
    },
  });

  res.status(201).json(checkin);
});

// DELETE /api/checkins/:id — admin only
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.checkIn.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
