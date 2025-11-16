-- Create users table for marketplace customers
-- Users authenticate with username, password, and 6-digit PIN
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only view and update their own data
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = (current_setting('app.current_user_id', true))::uuid);

-- Allow insert for registration (handled by server-side logic)
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (true);
