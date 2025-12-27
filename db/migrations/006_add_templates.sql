-- Diet Templates Table
CREATE TABLE diet_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diet Template Meals Table
CREATE TABLE diet_template_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_template_id UUID NOT NULL REFERENCES diet_templates(id) ON DELETE CASCADE,
  meal_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  protein_g NUMERIC DEFAULT 0,
  carbs_g NUMERIC DEFAULT 0,
  fat_g NUMERIC DEFAULT 0,
  calories_kcal NUMERIC DEFAULT 0,
  order_index INTEGER DEFAULT 0
);

-- Workout Templates Table
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workout Template Exercises Table
CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  day_name VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'STRENGTH',
  sets INTEGER,
  reps VARCHAR(50),
  duration VARCHAR(50),
  notes TEXT,
  order_index INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_diet_templates_trainer ON diet_templates(trainer_id);
CREATE INDEX idx_diet_template_meals_template ON diet_template_meals(diet_template_id);
CREATE INDEX idx_workout_templates_trainer ON workout_templates(trainer_id);
CREATE INDEX idx_workout_template_exercises_template ON workout_template_exercises(workout_template_id);
