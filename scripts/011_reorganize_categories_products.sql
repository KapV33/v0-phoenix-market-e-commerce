-- Reorganize categories for authentic darknet market structure

-- Clear existing categories
DELETE FROM categories;

-- Create main darknet market categories with proper structure
INSERT INTO categories (id, name, slug, description, parent_category_id, image_url) VALUES
-- Level 1: Main Categories
('a1111111-1111-1111-1111-111111111111', 'Fraud', 'fraud', 'Identity documents, financial tools, and fraud services', NULL, NULL),
('a2222222-2222-2222-2222-222222222222', 'Drugs', 'drugs', 'Pharmaceutical and recreational substances', NULL, NULL),
('a3333333-3333-3333-3333-333333333333', 'Digital Goods', 'digital-goods', 'Software, accounts, and digital services', NULL, NULL),
('a4444444-4444-4444-4444-444444444444', 'Services', 'services', 'Professional services and custom work', NULL, NULL),
('a5555555-5555-5555-5555-555555555555', 'Guides & Tutorials', 'guides', 'Educational material and tutorials', NULL, NULL),

-- Level 2: Fraud Subcategories
('b1111111-1111-1111-1111-111111111111', 'Documents', 'fraud-documents', 'Passports, IDs, licenses, and certificates', 'a1111111-1111-1111-1111-111111111111', NULL),
('b1111112-1111-1111-1111-111111111111', 'Financial', 'fraud-financial', 'Bank accounts, credit cards, and PayPal', 'a1111111-1111-1111-1111-111111111111', NULL),
('b1111113-1111-1111-1111-111111111111', 'Fullz & Dumps', 'fraud-fullz', 'Complete identity packages and card dumps', 'a1111111-1111-1111-1111-111111111111', NULL),
('b1111114-1111-1111-1111-111111111111', 'Tools & Software', 'fraud-tools', 'Fraud software and automated tools', 'a1111111-1111-1111-1111-111111111111', NULL),

-- Level 2: Drugs Subcategories
('b2222221-2222-2222-2222-222222222222', 'Cannabis', 'drugs-cannabis', 'Marijuana products and derivatives', 'a2222222-2222-2222-2222-222222222222', NULL),
('b2222222-2222-2222-2222-222222222222', 'Stimulants', 'drugs-stimulants', 'Cocaine, amphetamines, and similar', 'a2222222-2222-2222-2222-222222222222', NULL),
('b2222223-2222-2222-2222-222222222222', 'Psychedelics', 'drugs-psychedelics', 'LSD, mushrooms, and psychedelic substances', 'a2222222-2222-2222-2222-222222222222', NULL),
('b2222224-2222-2222-2222-222222222222', 'Prescription', 'drugs-prescription', 'Pharmaceutical medications', 'a2222222-2222-2222-2222-222222222222', NULL),

-- Level 2: Digital Goods Subcategories
('b3333331-3333-3333-3333-333333333333', 'Accounts', 'digital-accounts', 'Streaming, gaming, and social media accounts', 'a3333333-3333-3333-3333-333333333333', NULL),
('b3333332-3333-3333-3333-333333333333', 'Software', 'digital-software', 'Cracked software and licenses', 'a3333333-3333-3333-3333-333333333333', NULL),
('b3333333-3333-3333-3333-333333333333', 'Databases', 'digital-databases', 'Data leaks and breach databases', 'a3333333-3333-3333-3333-333333333333', NULL),
('b3333334-3333-3333-3333-333333333333', 'eBooks & Courses', 'digital-ebooks', 'Educational content and courses', 'a3333333-3333-3333-3333-333333333333', NULL),

-- Level 2: Services Subcategories
('b4444441-4444-4444-4444-444444444444', 'Hacking', 'services-hacking', 'Penetration testing and hacking services', 'a4444444-4444-4444-4444-444444444444', NULL),
('b4444442-4444-4444-4444-444444444444', 'Carding', 'services-carding', 'Carding and cashout services', 'a4444444-4444-4444-4444-444444444444', NULL),
('b4444443-4444-4444-4444-444444444444', 'Custom Work', 'services-custom', 'Bespoke services and custom jobs', 'a4444444-4444-4444-4444-444444444444', NULL),
('b4444444-4444-4444-4444-444444444444', 'Money Transfers', 'services-transfers', 'Money transfer and exchange services', 'a4444444-4444-4444-4444-444444444444', NULL);

-- Update existing products to use new categories (example migrations)
-- This should be adjusted based on actual product content
UPDATE products SET category_id = 'b1111111-1111-1111-1111-111111111111' 
WHERE name ILIKE '%passport%' OR name ILIKE '%license%' OR name ILIKE '%ID%';

UPDATE products SET category_id = 'b1111112-1111-1111-1111-111111111111' 
WHERE name ILIKE '%bank%' OR name ILIKE '%paypal%' OR name ILIKE '%card%';

UPDATE products SET category_id = 'b1111113-1111-1111-1111-111111111111' 
WHERE name ILIKE '%fullz%' OR name ILIKE '%dump%' OR name ILIKE '%CVV%';

UPDATE products SET category_id = 'b3333331-3333-3333-3333-333333333333' 
WHERE name ILIKE '%netflix%' OR name ILIKE '%spotify%' OR name ILIKE '%account%';

UPDATE products SET category_id = 'b3333332-3333-3333-3333-333333333333' 
WHERE name ILIKE '%software%' OR name ILIKE '%license%' OR name ILIKE '%windows%';
