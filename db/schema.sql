CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  trainer_id INTEGER REFERENCES users(id),
  sessions_remaining INTEGER DEFAULT 0,
  validity_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_role_check CHECK (role IN ('client', 'trainer', 'gym_owner'))
);

CREATE TABLE meal_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  image_url TEXT,
  meal_type VARCHAR(50),
  foods_detected TEXT[], -- Array of strings
  calories_est INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  date DATE NOT NULL,
  title VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workout_logs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sets INTEGER,
  reps VARCHAR(50),
  weight VARCHAR(50),
  notes TEXT
);
