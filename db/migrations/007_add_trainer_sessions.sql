-- Migration: Add Trainer Sessions Table
CREATE TABLE IF NOT EXISTS trainer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trainer_sessions_trainer_date ON trainer_sessions(trainer_id, session_date);
CREATE INDEX idx_trainer_sessions_client ON trainer_sessions(client_id);

-- Add some sample triggers for updated_at if they don't exist, but for now we'll just use the default.
