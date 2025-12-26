ALTER TABLE users ADD COLUMN trainer_id INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN sessions_remaining INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN validity_expires_at TIMESTAMP;
