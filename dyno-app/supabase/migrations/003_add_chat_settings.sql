-- Add chat_settings JSONB column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS chat_settings jsonb DEFAULT '{}'::jsonb;
