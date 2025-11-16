-- Add parent_category_id to categories table for subcategories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Create index for faster parent category lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_category_id);

-- Add a check to prevent circular references (category can't be its own parent)
ALTER TABLE public.categories 
ADD CONSTRAINT categories_no_self_reference CHECK (id != parent_category_id);

COMMENT ON COLUMN public.categories.parent_category_id IS 'Reference to parent category for subcategories. NULL for top-level categories.';
