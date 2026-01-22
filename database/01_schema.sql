-- ============================================================================
-- EXHIBITION BOOKING APP - DATABASE SCHEMA
-- ============================================================================
-- Run this script in Supabase SQL Editor to create all tables, RLS policies,
-- triggers, and functions needed for the exhibition booking application.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
-- Extends auth.users with additional user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: events
-- ============================================================================
-- Stores exhibition event information
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed')),
  total_stalls INTEGER NOT NULL DEFAULT 0,
  available_stalls INTEGER NOT NULL DEFAULT 0,
  price_per_stall NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: stalls
-- ============================================================================
-- Stores individual stall information for each event
CREATE TABLE IF NOT EXISTS stalls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  stall_number TEXT NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked', 'disabled')),
  price NUMERIC(10, 2) NOT NULL,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, stall_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stalls_event_id ON stalls(event_id);
CREATE INDEX IF NOT EXISTS idx_stalls_status ON stalls(status);

-- ============================================================================
-- TABLE: bookings
-- ============================================================================
-- Stores booking information
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id UUID,
  amount NUMERIC(10, 2) NOT NULL,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stall_id ON bookings(stall_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ============================================================================
-- TABLE: payments
-- ============================================================================
-- Stores payment transaction information
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stalls_updated_at ON stalls;
CREATE TRIGGER update_stalls_updated_at
  BEFORE UPDATE ON stalls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update available_stalls counter
-- ============================================================================
CREATE OR REPLACE FUNCTION update_event_available_stalls()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate available stalls for the event
  UPDATE events
  SET available_stalls = (
    SELECT COUNT(*)
    FROM stalls
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND status = 'available'
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update available_stalls when stalls are inserted/updated/deleted
DROP TRIGGER IF EXISTS trigger_update_available_stalls_insert ON stalls;
CREATE TRIGGER trigger_update_available_stalls_insert
  AFTER INSERT ON stalls
  FOR EACH ROW
  EXECUTE FUNCTION update_event_available_stalls();

DROP TRIGGER IF EXISTS trigger_update_available_stalls_update ON stalls;
CREATE TRIGGER trigger_update_available_stalls_update
  AFTER UPDATE ON stalls
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_event_available_stalls();

DROP TRIGGER IF EXISTS trigger_update_available_stalls_delete ON stalls;
CREATE TRIGGER trigger_update_available_stalls_delete
  AFTER DELETE ON stalls
  FOR EACH ROW
  EXECUTE FUNCTION update_event_available_stalls();

-- ============================================================================
-- RPC FUNCTION: create_booking_with_lock
-- ============================================================================
-- Atomic booking creation with optimistic locking to prevent double-booking
CREATE OR REPLACE FUNCTION create_booking_with_lock(
  p_event_id UUID,
  p_stall_id UUID,
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_stall_status TEXT;
  v_booking_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Lock the stall row for update (prevents concurrent bookings)
  SELECT status INTO v_stall_status
  FROM stalls
  WHERE id = p_stall_id AND event_id = p_event_id
  FOR UPDATE;

  -- Check if stall is available
  IF v_stall_status IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Stall not found'
    );
  END IF;

  IF v_stall_status != 'available' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Stall is not available'
    );
  END IF;

  -- Set expiration time (15 minutes from now)
  v_expires_at := NOW() + INTERVAL '15 minutes';

  -- Update stall status to reserved
  UPDATE stalls
  SET status = 'reserved'
  WHERE id = p_stall_id;

  -- Create the booking
  INSERT INTO bookings (
    event_id,
    stall_id,
    user_id,
    status,
    payment_status,
    amount,
    expires_at
  ) VALUES (
    p_event_id,
    p_stall_id,
    p_user_id,
    'pending',
    'pending',
    p_amount,
    v_expires_at
  )
  RETURNING id INTO v_booking_id;

  -- Return success with booking ID
  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION: cancel_expired_bookings
-- ============================================================================
-- Function to cancel expired bookings and free up stalls
CREATE OR REPLACE FUNCTION cancel_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Update expired bookings to cancelled
  WITH cancelled_bookings AS (
    UPDATE bookings
    SET status = 'cancelled',
        payment_status = 'failed'
    WHERE status = 'pending'
      AND payment_status = 'pending'
      AND expires_at < NOW()
    RETURNING stall_id
  )
  -- Free up the stalls
  UPDATE stalls
  SET status = 'available'
  WHERE id IN (SELECT stall_id FROM cancelled_bookings);

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can read all profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Everyone can view published events
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status IN ('published', 'ongoing', 'completed'));

-- Authenticated users can view all events (for admin dashboard)
DROP POLICY IF EXISTS "Authenticated users can view all events" ON events;
CREATE POLICY "Authenticated users can view all events"
  ON events FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete events (admin dashboard will use service role)
DROP POLICY IF EXISTS "Service role can manage events" ON events;
CREATE POLICY "Service role can manage events"
  ON events FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STALLS POLICIES
-- ============================================================================

-- Everyone can view stalls for published events
DROP POLICY IF EXISTS "Stalls are viewable for published events" ON stalls;
CREATE POLICY "Stalls are viewable for published events"
  ON stalls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = stalls.event_id
        AND events.status IN ('published', 'ongoing', 'completed')
    )
  );

-- Service role can manage stalls
DROP POLICY IF EXISTS "Service role can manage stalls" ON stalls;
CREATE POLICY "Service role can manage stalls"
  ON stalls FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

-- Users can view their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own bookings (via RPC function)
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellation)
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can view all bookings
DROP POLICY IF EXISTS "Service role can view all bookings" ON bookings;
CREATE POLICY "Service role can view all bookings"
  ON bookings FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

-- Users can view their own payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own payments
DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
CREATE POLICY "Users can create their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can view all payments
DROP POLICY IF EXISTS "Service role can view all payments" ON payments;
CREATE POLICY "Service role can view all payments"
  ON payments FOR SELECT
  USING (auth.role() = 'service_role');

-- Service role can update payments (for webhook processing)
DROP POLICY IF EXISTS "Service role can update payments" ON payments;
CREATE POLICY "Service role can update payments"
  ON payments FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE BUCKET FOR EVENT IMAGES
-- ============================================================================

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to event images
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
CREATE POLICY "Public can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

-- Allow authenticated users to upload event images (admin only in practice)
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to update event images
DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
CREATE POLICY "Authenticated users can update event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-images' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete event images
DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;
CREATE POLICY "Authenticated users can delete event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images' AND
    auth.role() = 'authenticated'
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON bookings(expires_at) WHERE status = 'pending';

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run the seed data script (02_seed_data.sql) to populate demo data
-- 2. Test the API functions in your mobile app
-- 3. Set up the admin dashboard to manage events
-- ============================================================================
