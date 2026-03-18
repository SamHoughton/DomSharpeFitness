const express    = require('express');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'sharpe-strength/progress',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// GET /api/checkins
//   Client → own check-ins
//   Dom    → all (or ?clientId=UUID for one client)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.is_dom) {
      const { clientId } = req.query;
      if (clientId) {
        const { rows } = await db.query(
          'SELECT * FROM check_ins WHERE profile_id = $1 ORDER BY week_date DESC',
          [clientId]
        );
        return res.json(rows);
      }
      const { rows } = await db.query(`
        SELECT c.*, p.name AS client_name
        FROM check_ins c
        JOIN profiles p ON p.id = c.profile_id
        ORDER BY c.week_date DESC
        LIMIT 100
      `);
      return res.json(rows);
    }

    const { rows } = await db.query(
      'SELECT * FROM check_ins WHERE profile_id = $1 ORDER BY week_date DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/checkins — client submits weekly check-in
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.is_dom) return res.status(403).json({ error: 'Dom cannot submit check-ins' });

    const {
      week_date, weight_kg, body_fat_pct,
      waist_cm, hips_cm, chest_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm,
      steps, sleep_hours, mood_score, energy_score, calories, nutrition_notes, notes
    } = req.body;

    const photo_url = req.file?.path || null;

    const { rows } = await db.query(`
      INSERT INTO check_ins (
        profile_id, week_date,
        weight_kg, body_fat_pct,
        waist_cm, hips_cm, chest_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm,
        steps, sleep_hours, mood_score, energy_score, calories, nutrition_notes,
        photo_url, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        req.user.id,
        week_date || new Date().toISOString().split('T')[0],
        weight_kg    || null, body_fat_pct  || null,
        waist_cm     || null, hips_cm       || null,
        chest_cm     || null, left_arm_cm   || null,
        right_arm_cm || null, left_thigh_cm || null, right_thigh_cm || null,
        steps || null, sleep_hours || null,
        mood_score || null, energy_score || null,
        calories || null, nutrition_notes || null,
        photo_url, notes || null
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
