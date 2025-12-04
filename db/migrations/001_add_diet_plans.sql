-- Diet Plan Versions Table
CREATE TABLE diet_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Assuming users table has id as INTEGER based on schema.sql
  created_by_trainer_id INTEGER REFERENCES users(id), -- Assuming trainers are also in users table or separate. If separate, adjust. Based on schema.sql, only users table exists.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  followed_from DATE NOT NULL,
  followed_till DATE, -- NULL means current
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diet Plan Meals Table
CREATE TABLE diet_plan_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_version_id UUID NOT NULL REFERENCES diet_plan_versions(id) ON DELETE CASCADE,
  meal_type VARCHAR(50) NOT NULL, -- pre_workout, post_workout, breakfast, lunch, snacks, dinner
  name VARCHAR(255) NOT NULL,
  description TEXT,
  protein_g NUMERIC DEFAULT 0,
  carbs_g NUMERIC DEFAULT 0,
  fat_g NUMERIC DEFAULT 0,
  calories_kcal NUMERIC DEFAULT 0,
  order_index INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_diet_versions_client_dates ON diet_plan_versions(client_id, followed_from, followed_till);
CREATE INDEX idx_diet_meals_version ON diet_plan_meals(diet_plan_version_id);

-- Unique constraint to ensure only one active plan per client (optional but good for integrity, though logic handles it)
-- CREATE UNIQUE INDEX idx_active_plan_per_client ON diet_plan_versions(client_id) WHERE followed_till IS NULL;
