-- Add role column to users table
ALTER TABLE users
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'client';

-- Add check constraint to ensure valid roles
ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'trainer', 'gym_owner'));
