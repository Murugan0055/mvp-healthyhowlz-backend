-- Add category to workout_plan_exercises
ALTER TABLE workout_plan_exercises
ADD COLUMN category VARCHAR(50) DEFAULT 'STRENGTH';

-- Add machine_photo_url to workout_completions
ALTER TABLE workout_completions
ADD COLUMN machine_photo_url TEXT;
