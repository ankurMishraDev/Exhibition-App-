-- ============================================================================
-- EXHIBITOR PROFILES - ONBOARDING SYSTEM
-- ============================================================================
-- Run this script to add exhibitor profile functionality
-- Users must complete this before booking stalls
-- ============================================================================

-- ============================================================================
-- TABLE: exhibitor_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS exhibitor_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  company_website TEXT,
  company_logo_url TEXT,
  contact_number TEXT NOT NULL,
  executive_name TEXT NOT NULL,
  executive_designation TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exhibitor_profiles_user_id ON exhibitor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_profiles_is_completed ON exhibitor_profiles(is_completed);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
DROP TRIGGER IF EXISTS update_exhibitor_profiles_updated_at ON exhibitor_profiles;
CREATE TRIGGER update_exhibitor_profiles_updated_at
  BEFORE UPDATE ON exhibitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Set is_completed flag automatically
-- ============================================================================
-- When all required fields are filled, mark as completed
CREATE OR REPLACE FUNCTION check_exhibitor_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_completed := (
    NEW.company_name IS NOT NULL AND NEW.company_name != '' AND
    NEW.company_domain IS NOT NULL AND NEW.company_domain != '' AND
    NEW.contact_number IS NOT NULL AND NEW.contact_number != '' AND
    NEW.executive_name IS NOT NULL AND NEW.executive_name != '' AND
    NEW.executive_designation IS NOT NULL AND NEW.executive_designation != ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_exhibitor_profile_completion ON exhibitor_profiles;
CREATE TRIGGER trigger_check_exhibitor_profile_completion
  BEFORE INSERT OR UPDATE ON exhibitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_exhibitor_profile_completion();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE exhibitor_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own exhibitor profile
DROP POLICY IF EXISTS "Users can view their own exhibitor profile" ON exhibitor_profiles;
CREATE POLICY "Users can view their own exhibitor profile"
  ON exhibitor_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own exhibitor profile
DROP POLICY IF EXISTS "Users can insert their own exhibitor profile" ON exhibitor_profiles;
CREATE POLICY "Users can insert their own exhibitor profile"
  ON exhibitor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own exhibitor profile
DROP POLICY IF EXISTS "Users can update their own exhibitor profile" ON exhibitor_profiles;
CREATE POLICY "Users can update their own exhibitor profile"
  ON exhibitor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can view all exhibitor profiles (admin dashboard)
DROP POLICY IF EXISTS "Service role can view all exhibitor profiles" ON exhibitor_profiles;
CREATE POLICY "Service role can view all exhibitor profiles"
  ON exhibitor_profiles FOR SELECT
  USING (auth.role() = 'service_role');

-- Everyone can view exhibitor profiles (for viewing booked stall details)
DROP POLICY IF EXISTS "Public can view completed exhibitor profiles" ON exhibitor_profiles;
CREATE POLICY "Public can view completed exhibitor profiles"
  ON exhibitor_profiles FOR SELECT
  USING (is_completed = true);

-- ============================================================================
-- STORAGE BUCKET FOR COMPANY LOGOS
-- ============================================================================
-- This bucket already exists as 'exhibitor-logos' from 04_add_halls_support.sql
-- Just adding a note here for reference

-- ============================================================================
-- UPDATE BOOKINGS: Store exhibitor snapshot at booking time
-- ============================================================================
-- Add columns to bookings to store exhibitor info at time of booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS exhibitor_snapshot JSONB;

COMMENT ON COLUMN bookings.exhibitor_snapshot IS 'Snapshot of exhibitor details at booking time - immutable after booking';

-- ============================================================================
-- FUNCTION: Copy exhibitor data to stall on booking confirmation
-- ============================================================================
CREATE OR REPLACE FUNCTION copy_exhibitor_to_stall()
RETURNS TRIGGER AS $$
DECLARE
  v_exhibitor_data JSONB;
BEGIN
  -- Only execute when booking status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Get exhibitor profile data
    SELECT jsonb_build_object(
      'company_name', company_name,
      'company_domain', company_domain,
      'company_website', company_website,
      'company_logo_url', company_logo_url,
      'contact_number', contact_number,
      'executive_name', executive_name,
      'executive_designation', executive_designation
    )
    INTO v_exhibitor_data
    FROM exhibitor_profiles
    WHERE user_id = NEW.user_id
      AND is_completed = true;

    -- Store snapshot in booking record
    NEW.exhibitor_snapshot := v_exhibitor_data;

    -- Update stall with exhibitor info (frozen at booking time)
    IF v_exhibitor_data IS NOT NULL THEN
      UPDATE stalls
      SET 
        company_name = v_exhibitor_data->>'company_name',
        company_logo_url = v_exhibitor_data->>'company_logo_url'
      WHERE id = NEW.stall_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_copy_exhibitor_to_stall ON bookings;
CREATE TRIGGER trigger_copy_exhibitor_to_stall
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION copy_exhibitor_to_stall();

-- ============================================================================
-- RPC FUNCTION: Check if user can book (has completed exhibitor profile)
-- ============================================================================
CREATE OR REPLACE FUNCTION can_user_book_stall(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_completed BOOLEAN;
BEGIN
  SELECT is_completed INTO v_is_completed
  FROM exhibitor_profiles
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_is_completed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EXHIBITOR PROFILES SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create exhibitor details form in the mobile app
-- 2. Add validation before booking to check if profile is completed
-- 3. Display exhibitor info on booked stalls
-- ============================================================================
