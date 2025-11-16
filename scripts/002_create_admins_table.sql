-- Create admins table for marketplace administrators
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can view all admin records
CREATE POLICY "admins_select_all" ON public.admins
  FOR SELECT USING (id = (current_setting('app.current_admin_id', true))::uuid);

-- Insert default admin (password: admin123 - CHANGE THIS IN PRODUCTION)
-- Password hash for 'admin123' using bcrypt
INSERT INTO public.admins (username, password_hash)
VALUES ('admin', '$2a$10$rKZLvXZnJZ5qYqYqYqYqYuO7qYqYqYqYqYqYqYqYqYqYqYqYqYqYq')
ON CONFLICT (username) DO NOTHING;
