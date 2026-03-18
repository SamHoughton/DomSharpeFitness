-- Run this once against your Railway Postgres database
-- Railway dashboard → your Postgres service → Query tab

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Client accounts (+ Dom's own account)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name         TEXT NOT NULL,
  goal         TEXT,
  experience   TEXT,
  is_dom       BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Public consultation form submissions
CREATE TABLE IF NOT EXISTS consultations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  goal         TEXT,
  experience   TEXT,
  availability TEXT,
  message      TEXT,
  status       TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly client check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_date       DATE NOT NULL,
  -- Body composition
  weight_kg       NUMERIC(5,2),
  body_fat_pct    NUMERIC(4,1),
  -- Measurements (cm)
  waist_cm        NUMERIC(5,1),
  hips_cm         NUMERIC(5,1),
  chest_cm        NUMERIC(5,1),
  left_arm_cm     NUMERIC(5,1),
  right_arm_cm    NUMERIC(5,1),
  left_thigh_cm   NUMERIC(5,1),
  right_thigh_cm  NUMERIC(5,1),
  -- Lifestyle
  steps           INTEGER,
  sleep_hours     NUMERIC(3,1),
  mood_score      INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  energy_score    INTEGER CHECK (energy_score BETWEEN 1 AND 10),
  calories        INTEGER,
  nutrition_notes TEXT,
  -- Media & notes
  photo_url       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Messages between Dom and each client
CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL CHECK (sender IN ('dom', 'client')),
  body       TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
