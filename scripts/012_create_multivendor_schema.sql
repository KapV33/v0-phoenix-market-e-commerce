-- Multi-Vendor Marketplace Database Schema
-- This creates all necessary tables for vendors, wallets, escrow, messaging, and commissions

-- 1. Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  pgp_public_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  avatar_url TEXT,
  bio TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(20, 8) DEFAULT 0 NOT NULL CHECK (balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'escrow_lock', 'escrow_release', 'commission', 'refund')),
  amount NUMERIC(20, 8) NOT NULL,
  balance_after NUMERIC(20, 8) NOT NULL,
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('order', 'withdrawal', 'topup')),
  description TEXT,
  crypto_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Escrows table
CREATE TABLE IF NOT EXISTS escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  buyer_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  amount NUMERIC(20, 8) NOT NULL,
  commission_amount NUMERIC(20, 8) NOT NULL,
  vendor_amount NUMERIC(20, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disputed', 'released', 'refunded')),
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'physical')),
  auto_finalize_at TIMESTAMP WITH TIME ZONE NOT NULL,
  extended_count INTEGER DEFAULT 0 CHECK (extended_count >= 0 AND extended_count <= 5),
  finalized_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id),
  opened_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved_buyer', 'resolved_vendor', 'resolved_partial')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES admins(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Messages table (for vendor-buyer communication and support tickets)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'vendor', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('support_ticket', 'vendor_message', 'dispute')),
  subject TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  dispute_id UUID REFERENCES disputes(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
  crypto_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  tx_hash TEXT,
  processed_by UUID REFERENCES admins(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Commission settings table
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_type TEXT NOT NULL CHECK (setting_type IN ('global', 'category', 'vendor', 'product')),
  reference_id UUID,
  commission_percentage NUMERIC(5, 2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add vendor_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE;

-- Add product type to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital' CHECK (product_type IN ('digital', 'physical'));

-- Update orders table to include vendor and escrow info
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id),
ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none' CHECK (escrow_status IN ('none', 'active', 'disputed', 'released', 'refunded'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_escrows_order_id ON escrows(order_id);
CREATE INDEX IF NOT EXISTS idx_escrows_buyer_id ON escrows(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrows_vendor_id ON escrows(vendor_id);
CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows(status);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow_id ON disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_vendor_id ON withdrawals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);

-- Enable RLS on all new tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY vendors_select_all ON vendors FOR SELECT USING (true);
CREATE POLICY vendors_insert_own ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY vendors_update_own ON vendors FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for wallets
CREATE POLICY wallets_select_own ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY wallets_insert_system ON wallets FOR INSERT WITH CHECK (true);

-- RLS Policies for wallet_transactions
CREATE POLICY wallet_transactions_select_own ON wallet_transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM wallets WHERE wallets.id = wallet_transactions.wallet_id AND wallets.user_id = auth.uid()));

-- RLS Policies for escrows
CREATE POLICY escrows_select_participant ON escrows FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() IN (SELECT user_id FROM vendors WHERE vendors.id = escrows.vendor_id));

-- RLS Policies for disputes
CREATE POLICY disputes_select_participant ON disputes FOR SELECT
  USING (auth.uid() = opened_by OR auth.uid() IN (SELECT buyer_id FROM escrows WHERE escrows.id = disputes.escrow_id) OR auth.uid() IN (SELECT vendors.user_id FROM escrows JOIN vendors ON escrows.vendor_id = vendors.id WHERE escrows.id = disputes.escrow_id));

-- RLS Policies for messages
CREATE POLICY messages_select_participant ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() IN (SELECT user_id FROM conversations WHERE conversations.id = messages.conversation_id));
CREATE POLICY messages_insert_participant ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for conversations
CREATE POLICY conversations_select_participant ON conversations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM vendors WHERE vendors.id = conversations.vendor_id));
CREATE POLICY conversations_insert_own ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for withdrawals
CREATE POLICY withdrawals_select_own ON withdrawals FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE vendors.id = withdrawals.vendor_id));
CREATE POLICY withdrawals_insert_own ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM vendors WHERE vendors.id = withdrawals.vendor_id));

-- RLS Policies for commission_settings (admin only)
CREATE POLICY commission_settings_select_all ON commission_settings FOR SELECT USING (true);

-- Insert default global commission rate (10%)
INSERT INTO commission_settings (setting_type, commission_percentage)
VALUES ('global', 10.00)
ON CONFLICT DO NOTHING;

-- Create function to auto-create wallet on user registration
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create wallet
DROP TRIGGER IF EXISTS trigger_create_wallet_for_new_user ON users;
CREATE TRIGGER trigger_create_wallet_for_new_user
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers for all tables with updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escrows_updated_at BEFORE UPDATE ON escrows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON commission_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
