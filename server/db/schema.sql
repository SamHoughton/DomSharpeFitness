-- Runs automatically on every Railway deploy (see migrate.js).
-- Safe to re-run: everything is CREATE ... IF NOT EXISTS.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin account (Dom). Created once via POST /api/auth/setup-dom.
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  is_dom        BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
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

CREATE INDEX IF NOT EXISTS consultations_created_at_idx ON consultations (created_at DESC);
CREATE INDEX IF NOT EXISTS consultations_status_idx     ON consultations (status);

-- ---------------------------------------------------------------------------
-- The client portal was removed. The tables below are no longer used by the
-- API, but they are NOT dropped automatically because they may still hold real
-- client data. Once you have exported anything you want to keep, run these by
-- hand in the Railway query console:
--
--   DROP TABLE IF EXISTS check_ins;
--   DROP TABLE IF EXISTS messages;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS goal;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS experience;
--   DELETE FROM profiles WHERE is_dom = FALSE;
-- ---------------------------------------------------------------------------
