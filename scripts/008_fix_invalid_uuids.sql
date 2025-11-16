-- Fix any products with invalid category_id values
-- This script cleans up any products that have 'default' or other invalid strings in UUID fields

-- Set invalid category_id values to NULL
UPDATE public.products
SET category_id = NULL
WHERE category_id::text = 'default' 
   OR category_id IS NOT NULL 
   AND NOT (category_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Add a comment to track this fix
COMMENT ON TABLE public.products IS 'Products table - cleaned invalid UUIDs on ' || NOW()::text;
