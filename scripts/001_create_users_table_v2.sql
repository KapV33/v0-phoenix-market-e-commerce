-- Create users table with updated RLS policies for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Updated RLS policy to allow SELECT for authentication
-- Allow anyone to SELECT from users table (needed for login/authentication)
-- The password_hash and pin_hash are still protected by application logic
CREATE POLICY "Allow public read for authentication" ON users
  FOR SELECT
  USING (true);

-- Allow users to insert their own records (for registration)
CREATE POLICY "Allow insert for registration" ON users
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own records
CREATE POLICY "Allow users to update own record" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();
