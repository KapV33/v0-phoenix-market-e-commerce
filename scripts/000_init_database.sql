-- Phoenix Market Database Schema Initialization
-- This script creates all tables, indexes, and policies for the marketplace

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_own') THEN
    CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = (current_setting('app.current_user_id', true))::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_own') THEN
    CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = (current_setting('app.current_user_id', true))::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_insert') THEN
    CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 2. Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admins' AND policyname = 'admins_select_all') THEN
    CREATE POLICY "admins_select_all" ON public.admins FOR SELECT USING (id = (current_setting('app.current_admin_id', true))::uuid);
  END IF;
END $$;

-- Insert default admin (username: Kaptein, password: admin123 - CHANGE THIS)
INSERT INTO public.admins (username, password_hash)
VALUES ('Kaptein', '$2a$10$rKZLvXZnJZ5qYqYqYqYqYuO7qYqYqYqYqYqYqYqYqYqYqYqYqYqYq')
ON CONFLICT (username) DO NOTHING;

-- 3. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_category_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_select_all') THEN
    CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_insert_admin') THEN
    CREATE POLICY "categories_insert_admin" ON public.categories FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_update_admin') THEN
    CREATE POLICY "categories_update_admin" ON public.categories FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_delete_admin') THEN
    CREATE POLICY "categories_delete_admin" ON public.categories FOR DELETE USING (true);
  END IF;
END $$;

-- 4. Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'vendors_select_all') THEN
    CREATE POLICY "vendors_select_all" ON public.vendors FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'vendors_insert_own') THEN
    CREATE POLICY "vendors_insert_own" ON public.vendors FOR INSERT WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'vendors_update_own') THEN
    CREATE POLICY "vendors_update_own" ON public.vendors FOR UPDATE USING (user_id = (current_setting('app.current_user_id', true))::uuid);
  END IF;
END $$;

-- 5. Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  delivery_content TEXT,
  vendor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_vendor_name ON public.products(vendor_name);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_select_active') THEN
    CREATE POLICY "products_select_active" ON public.products FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_insert_admin') THEN
    CREATE POLICY "products_insert_admin" ON public.products FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_update_admin') THEN
    CREATE POLICY "products_update_admin" ON public.products FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_delete_admin') THEN
    CREATE POLICY "products_delete_admin" ON public.products FOR DELETE USING (true);
  END IF;
END $$;

-- 6. Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  btc_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'wallets_select_own') THEN
    CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (user_id = (current_setting('app.current_user_id', true))::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'wallets_insert_system') THEN
    CREATE POLICY "wallets_insert_system" ON public.wallets FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'wallets_update_system') THEN
    CREATE POLICY "wallets_update_system" ON public.wallets FOR UPDATE USING (true);
  END IF;
END $$;

-- 7. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'refund', 'escrow_hold', 'escrow_release')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'wallet_transactions_select_own') THEN
    CREATE POLICY "wallet_transactions_select_own" ON public.wallet_transactions FOR SELECT USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = (current_setting('app.current_user_id', true))::uuid));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'wallet_transactions_insert_system') THEN
    CREATE POLICY "wallet_transactions_insert_system" ON public.wallet_transactions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 8. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'completed', 'cancelled', 'disputed')),
  delivery_content TEXT,
  crypto_address TEXT,
  payment_tx_hash TEXT,
  escrow_amount DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_select_own') THEN
    CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (user_id = (current_setting('app.current_user_id', true))::uuid OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (current_setting('app.current_user_id', true))::uuid));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_insert_own') THEN
    CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_update_own') THEN
    CREATE POLICY "orders_update_own" ON public.orders FOR UPDATE USING (user_id = (current_setting('app.current_user_id', true))::uuid OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (current_setting('app.current_user_id', true))::uuid));
  END IF;
END $$;
