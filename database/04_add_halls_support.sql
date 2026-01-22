-- ============================================================================
-- ADD HALLS SUPPORT TO EXISTING SCHEMA
-- ============================================================================
-- Run this script to add hall support and company logo features
-- ============================================================================

-- Add new columns to stalls table
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS hall_id TEXT;
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Create index for hall filtering
CREATE INDEX IF NOT EXISTS idx_stalls_hall_id ON stalls(hall_id);

-- Create halls reference table (optional but recommended)
CREATE TABLE IF NOT EXISTS halls (
  id TEXT PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout_type TEXT,
  color_theme TEXT,
  total_stalls INTEGER DEFAULT 0,
  available_stalls INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on halls table
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for halls table
CREATE POLICY "Everyone can view active halls"
  ON halls FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage halls"
  ON halls FOR ALL
  USING (auth.role() = 'service_role');

-- Add trigger for updated_at on halls
CREATE TRIGGER update_halls_updated_at
  BEFORE UPDATE ON halls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update hall availability counts
CREATE OR REPLACE FUNCTION update_hall_available_stalls()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE halls
    SET 
      total_stalls = (
        SELECT COUNT(*) 
        FROM stalls 
        WHERE hall_id = NEW.hall_id 
        AND event_id = NEW.event_id
      ),
      available_stalls = (
        SELECT COUNT(*) 
        FROM stalls 
        WHERE hall_id = NEW.hall_id 
        AND event_id = NEW.event_id 
        AND status = 'available'
      )
    WHERE id = NEW.hall_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE halls
    SET 
      total_stalls = (
        SELECT COUNT(*) 
        FROM stalls 
        WHERE hall_id = OLD.hall_id 
        AND event_id = OLD.event_id
      ),
      available_stalls = (
        SELECT COUNT(*) 
        FROM stalls 
        WHERE hall_id = OLD.hall_id 
        AND event_id = OLD.event_id 
        AND status = 'available'
      )
    WHERE id = OLD.hall_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update hall availability
DROP TRIGGER IF EXISTS update_hall_stalls_count ON stalls;
CREATE TRIGGER update_hall_stalls_count
  AFTER INSERT OR UPDATE OR DELETE ON stalls
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_available_stalls();

-- Storage bucket for exhibitor logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('exhibitor-logos', 'exhibitor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for exhibitor logos
CREATE POLICY "Public can view exhibitor logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exhibitor-logos');

CREATE POLICY "Authenticated users can upload exhibitor logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exhibitor-logos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Service role can manage exhibitor logos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'exhibitor-logos' 
    AND auth.role() = 'service_role'
  );

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS create_booking_with_lock(uuid,uuid,uuid,numeric);

-- Update existing create_booking_with_lock to handle company info
CREATE OR REPLACE FUNCTION create_booking_with_lock(
  p_event_id UUID,
  p_stall_id UUID,
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_booking_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_stall_status TEXT;
  v_hall_id TEXT;
BEGIN
  -- Lock the stall row for update
  SELECT status, hall_id INTO v_stall_status, v_hall_id
  FROM stalls
  WHERE id = p_stall_id
  FOR UPDATE;

  -- Check if stall is available
  IF v_stall_status != 'available' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Stall is not available'
    );
  END IF;

  -- Set expiration time (15 minutes from now)
  v_expires_at := NOW() + INTERVAL '15 minutes';

  -- Create booking
  INSERT INTO bookings (event_id, stall_id, user_id, status, payment_status, amount, expires_at)
  VALUES (p_event_id, p_stall_id, p_user_id, 'pending', 'pending', p_amount, v_expires_at)
  RETURNING id INTO v_booking_id;

  -- Update stall status to reserved
  UPDATE stalls
  SET status = 'reserved'
  WHERE id = p_stall_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
