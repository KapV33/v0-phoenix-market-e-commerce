-- Create categories table for product organization
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

-- Only admins can modify categories (handled by server-side logic)
CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (true);

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (true);
