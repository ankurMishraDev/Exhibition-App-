-- ============================================================================
-- CREATE ADMIN USER MANUALLY
-- ============================================================================
-- Run this in Supabase SQL Editor to create an admin account
-- Email: ankur@gmail.com
-- Password: asdf@1234
-- ============================================================================

-- This will create a user in the auth.users table
-- You'll need to run this in Supabase Dashboard > SQL Editor

-- Note: Supabase Auth doesn't allow direct password insertion via SQL
-- You need to use the Supabase Dashboard UI to create users

-- Alternative Method 1: Use Supabase Dashboard
-- 1. Go to https://supabase.com/dashboard/project/rihbalxthmgpxzsuogux/auth/users
-- 2. Click "Add User" button
-- 3. Enter email: ankur@gmail.com
-- 4. Enter password: asdf@1234
-- 5. Click "Create User"

-- Alternative Method 2: Enable email signup temporarily
-- If you want a signup page, I can create one in the admin dashboard

-- After creating the user via Dashboard, run this to create their profile:

-- First, get the user ID from auth.users
-- SELECT id, email FROM auth.users WHERE email = 'ankur@gmail.com';

-- Then insert the profile (replace USER_ID with actual UUID from above query)
/*
INSERT INTO profiles (id, name, phone)
VALUES (
  'USER_ID_HERE',
  'Ankur',
  '+91 98765 43210'
);
*/
