-- Create products table for digital goods
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  delivery_content TEXT, -- The digital content to be delivered
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "products_select_active" ON public.products
  FOR SELECT USING (is_active = true);

-- Only admins can modify products (handled by server-side logic)
CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE USING (true);

CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE USING (true);
