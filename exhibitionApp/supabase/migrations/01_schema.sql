-- Exhibition Booking App - Database Schema
-- Generated: 2025-11-28

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extended user information beyond Supabase Auth
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- EVENTS TABLE
-- Exhibition events with stall management
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed')),
  total_stalls INTEGER DEFAULT 0,
  available_stalls INTEGER DEFAULT 0,
  price_per_stall DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Service role can manage events"
  ON public.events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- STALLS TABLE
-- Individual booth/stall positions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stalls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stall_number TEXT NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked', 'disabled')),
  price DECIMAL(10,2) NOT NULL,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, stall_number)
);

-- RLS Policies for stalls
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stalls for published events"
  ON public.stalls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = stalls.event_id 
      AND events.status = 'published'
    )
  );

CREATE POLICY "Service role can manage stalls"
  ON public.stalls FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- BOOKINGS TABLE
-- User stall reservations with expiration
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stall_id UUID NOT NULL REFERENCES public.stalls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all bookings"
  ON public.bookings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PAYMENTS TABLE
-- Payment transactions with Razorpay integration
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payments"
  ON public.payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- TRIGGERS
-- Auto-update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stalls_updated_at BEFORE UPDATE ON public.stalls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- Atomic booking creation with row locking
-- =====================================================

CREATE OR REPLACE FUNCTION create_booking_with_lock(
  p_event_id UUID,
  p_stall_id UUID,
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_stall_status TEXT;
BEGIN
  -- Lock the stall row for update
  SELECT status INTO v_stall_status
  FROM public.stalls
  WHERE id = p_stall_id
  FOR UPDATE;

  -- Check if stall is available
  IF v_stall_status != 'available' THEN
    RAISE EXCEPTION 'Stall is not available';
  END IF;

  -- Update stall status to reserved
  UPDATE public.stalls
  SET status = 'reserved',
      updated_at = NOW()
  WHERE id = p_stall_id;

  -- Create booking with 15-minute expiration
  INSERT INTO public.bookings (
    event_id,
    stall_id,
    user_id,
    amount,
    status,
    payment_status,
    expires_at
  ) VALUES (
    p_event_id,
    p_stall_id,
    p_user_id,
    p_amount,
    'pending',
    'pending',
    NOW() + INTERVAL '15 minutes'
  ) RETURNING id INTO v_booking_id;

  -- Update event available stalls count
  UPDATE public.events
  SET available_stalls = available_stalls - 1,
      updated_at = NOW()
  WHERE id = p_event_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function to cancel expired bookings
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_cancelled_count INTEGER := 0;
  v_booking RECORD;
BEGIN
  FOR v_booking IN
    SELECT id, event_id, stall_id
    FROM public.bookings
    WHERE status = 'pending'
    AND payment_status = 'pending'
    AND expires_at < NOW()
  LOOP
    -- Update booking status
    UPDATE public.bookings
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_booking.id;

    -- Free the stall
    UPDATE public.stalls
    SET status = 'available',
        updated_at = NOW()
    WHERE id = v_booking.stall_id;

    -- Increment available stalls
    UPDATE public.events
    SET available_stalls = available_stalls + 1,
        updated_at = NOW()
    WHERE id = v_booking.event_id;

    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;

  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE
-- Event images bucket
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Service role can manage event images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'event-images' 
    AND auth.jwt()->>'role' = 'service_role'
  );

-- =====================================================
-- INDEXES
-- Performance optimization
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_stalls_event_id ON public.stalls(event_id);
CREATE INDEX IF NOT EXISTS idx_stalls_status ON public.stalls(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);

-- =====================================================
-- COMMENTS
-- Documentation for database objects
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Extended user information beyond Supabase Auth';
COMMENT ON TABLE public.events IS 'Exhibition events with stall management';
COMMENT ON TABLE public.stalls IS 'Individual booth/stall positions with grid layout';
COMMENT ON TABLE public.bookings IS 'User stall reservations with 15-minute expiration';
COMMENT ON TABLE public.payments IS 'Payment transactions with Razorpay integration';

COMMENT ON FUNCTION create_booking_with_lock IS 'Atomically creates a booking and reserves a stall';
COMMENT ON FUNCTION cancel_expired_bookings IS 'Cancels bookings that have expired without payment';
