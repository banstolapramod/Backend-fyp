-- Migration: Add vendor_status column to users table
-- This allows admin approval workflow for vendor accounts

-- Add vendor_status column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vendor_status VARCHAR(20) DEFAULT 'approved' 
CHECK (vendor_status IN ('pending', 'approved', 'rejected'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_vendor_status ON users(vendor_status);

-- Update existing vendors to 'approved' status (backward compatibility)
UPDATE users 
SET vendor_status = 'approved' 
WHERE role = 'vendor' AND vendor_status IS NULL;

-- Update existing customers and admins to 'approved' status
UPDATE users 
SET vendor_status = 'approved' 
WHERE role IN ('customer', 'admin') AND vendor_status IS NULL;

-- Display updated schema
SELECT user_id, name, email, role, vendor_status, created_at 
FROM users 
ORDER BY created_at DESC;
