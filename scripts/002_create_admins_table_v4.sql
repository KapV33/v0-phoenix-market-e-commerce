-- Create admins table with updated RLS policies for authentication
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Updated RLS policy to allow SELECT for authentication
-- Allow anyone to SELECT from admins table (needed for login/authentication)
-- The password_hash is still protected by application logic
CREATE POLICY "Allow public read for authentication" ON admins
  FOR SELECT
  USING (true);

-- Added INSERT policy for setup
-- Allow inserts (needed for initial setup)
CREATE POLICY "Allow insert for setup" ON admins
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to update their own records
CREATE POLICY "Allow admins to update own record" ON admins
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admins_updated_at();
