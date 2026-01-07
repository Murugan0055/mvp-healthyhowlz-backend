-- Migration to add AI usage tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_usage_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ai_usage_date DATE DEFAULT CURRENT_DATE;
