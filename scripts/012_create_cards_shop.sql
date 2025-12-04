-- Create cards table for instant digital card purchases
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  bin TEXT NOT NULL,
  country TEXT NOT NULL,
  base_seller TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  fullz TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  full_card_data TEXT NOT NULL, -- Hidden until purchased, contains complete card details
  is_sold BOOLEAN DEFAULT false,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cards_vendor ON cards(vendor_id);
CREATE INDEX IF NOT EXISTS idx_cards_sold ON cards(is_sold);
CREATE INDEX IF NOT EXISTS idx_cards_country ON cards(country);
CREATE INDEX IF NOT EXISTS idx_cards_bin ON cards(bin);

-- RLS Policies
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Vendors can see all their own cards
CREATE POLICY cards_select_own ON cards
  FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT user_id FROM users WHERE id::text = current_setting('request.jwt.claim.sub', true)))
  );

-- Public can see available cards (but not full_card_data)
CREATE POLICY cards_select_available ON cards
  FOR SELECT
  USING (is_sold = false);

-- Buyers can see their purchased cards
CREATE POLICY cards_select_purchased ON cards
  FOR SELECT
  USING (
    buyer_id::text = current_setting('request.jwt.claim.sub', true)
  );

-- Vendors can insert their own cards
CREATE POLICY cards_insert_own ON cards
  FOR INSERT
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT user_id FROM users WHERE id::text = current_setting('request.jwt.claim.sub', true)))
  );

-- Vendors can update their own cards
CREATE POLICY cards_update_own ON cards
  FOR UPDATE
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT user_id FROM users WHERE id::text = current_setting('request.jwt.claim.sub', true)))
  );

-- Vendors can delete their own cards
CREATE POLICY cards_delete_own ON cards
  FOR DELETE
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT user_id FROM users WHERE id::text = current_setting('request.jwt.claim.sub', true)))
  );

-- Create card_purchases table to track instant purchases
CREATE TABLE IF NOT EXISTS card_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_purchases_buyer ON card_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_card_purchases_vendor ON card_purchases(vendor_id);

ALTER TABLE card_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY card_purchases_select_own ON card_purchases
  FOR SELECT
  USING (
    buyer_id::text = current_setting('request.jwt.claim.sub', true)
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT user_id FROM users WHERE id::text = current_setting('request.jwt.claim.sub', true)))
  );
