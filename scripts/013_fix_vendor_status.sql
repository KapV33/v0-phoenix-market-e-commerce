-- Update vendor status check to include pgp_only status
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_status_check 
  CHECK (status IN ('pgp_only', 'pending', 'approved', 'rejected', 'suspended'));
