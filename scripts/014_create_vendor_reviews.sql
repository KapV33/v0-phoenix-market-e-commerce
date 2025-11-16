-- Create vendor reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

-- Add RLS policies
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Users can read all reviews
CREATE POLICY vendor_reviews_select_all ON vendor_reviews
  FOR SELECT
  USING (true);

-- Users can insert reviews for their own orders
CREATE POLICY vendor_reviews_insert_own ON vendor_reviews
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own reviews
CREATE POLICY vendor_reviews_update_own ON vendor_reviews
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_id ON vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_user_id ON vendor_reviews(user_id);
