-- Workout Plan Versions Table
CREATE TABLE workout_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_trainer_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  followed_from DATE NOT NULL,
  followed_till DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workout Plan Exercises Table
CREATE TABLE workout_plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_version_id UUID NOT NULL REFERENCES workout_plan_versions(id) ON DELETE CASCADE,
  day_name VARCHAR(50) NOT NULL, -- e.g. "Monday", "Day 1"
  name VARCHAR(255) NOT NULL,
  sets INTEGER,
  reps VARCHAR(50),
  duration VARCHAR(50),
  notes TEXT,
  order_index INTEGER DEFAULT 0
);

-- Workout Completions Table
CREATE TABLE workout_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_plan_exercise_id UUID NOT NULL REFERENCES workout_plan_exercises(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, workout_plan_exercise_id, date)
);

-- Indexes
CREATE INDEX idx_workout_versions_client_dates ON workout_plan_versions(client_id, followed_from, followed_till);
CREATE INDEX idx_workout_exercises_version ON workout_plan_exercises(workout_plan_version_id);
CREATE INDEX idx_workout_completions_user_date ON workout_completions(user_id, date);
