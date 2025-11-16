-- Create orders table for purchase tracking
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- Store product name in case product is deleted
  product_price DECIMAL(10, 2) NOT NULL,
  crypto_address TEXT NOT NULL, -- Customer's crypto wallet address
  payment_tx_hash TEXT, -- Transaction hash for verification
  payment_status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  delivery_status TEXT DEFAULT 'pending', -- pending, delivered
  delivered_content TEXT, -- The actual digital content delivered
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can only view their own orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Users can create orders
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Only system can update orders (handled by server-side logic)
CREATE POLICY "orders_update_system" ON public.orders
  FOR UPDATE USING (true);
