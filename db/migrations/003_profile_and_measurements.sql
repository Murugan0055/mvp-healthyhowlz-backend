-- Migration: Add Profile and Measurements Tables
-- Description: Extends user data with profile information and body tracking

-- 1. Extend users table with profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Create user_body_metrics table for weight, height, BMI, etc.
CREATE TABLE IF NOT EXISTS user_body_metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  bmi NUMERIC(4,2),
  bmr NUMERIC(6,2),
  body_fat_percent NUMERIC(4,2),
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON user_body_metrics(user_id, recorded_at DESC);

-- 3. Create user_body_measurements table for body part measurements
CREATE TABLE IF NOT EXISTS user_body_measurements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL,
  arm_cm NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hip_cm NUMERIC(5,2),
  thigh_cm NUMERIC(5,2),
  calf_cm NUMERIC(5,2),
  shoulders_cm NUMERIC(5,2),
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON user_body_measurements(user_id, recorded_at DESC);
