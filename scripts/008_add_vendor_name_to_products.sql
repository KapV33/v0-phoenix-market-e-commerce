-- Add vendor_name column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_name TEXT;

-- Create index for vendor name searches
CREATE INDEX IF NOT EXISTS idx_products_vendor_name ON products(vendor_name);

COMMENT ON COLUMN products.vendor_name IS 'Optional vendor/brand name for the product';
