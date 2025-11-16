-- Make crypto_address nullable for wallet-based payments
-- This allows orders to be created via wallet without requiring blockchain transactions

ALTER TABLE orders 
ALTER COLUMN crypto_address DROP NOT NULL;

ALTER TABLE orders 
ALTER COLUMN payment_tx_hash DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN orders.crypto_address IS 'BTC address for payment tracking. Nullable for wallet-based purchases.';
COMMENT ON COLUMN orders.payment_tx_hash IS 'Transaction hash for crypto payments or wallet payment identifier';
