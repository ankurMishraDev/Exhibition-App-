-- ============================================================================
-- EXHIBITION BOOKING APP - SEED DATA
-- ============================================================================
-- Run this script AFTER 01_schema.sql to populate demo data
-- ============================================================================

-- ============================================================================
-- DEMO USERS
-- ============================================================================
-- Note: Users are created through Supabase Auth, not directly in the database.
-- Use the following credentials to create test accounts via the mobile app:
--
-- Demo User 1:
--   Email: demo1@example.com
--   Password: Demo@123456
--   Name: Rajesh Kumar
--   Phone: +91 98765 43210
--
-- Demo User 2:
--   Email: demo2@example.com
--   Password: Demo@123456
--   Name: Priya Sharma
--   Phone: +91 98765 43211
--
-- Demo User 3:
--   Email: demo3@example.com
--   Password: Demo@123456
--   Name: Amit Patel
--   Phone: +91 98765 43212
--
-- Admin Account:
--   Email: admin@exhibitionapp.com
--   Password: Admin@123456
--   Name: Exhibition Admin
--
-- After creating these accounts via signup, their profile records will be
-- automatically created by the trigger function.
-- ============================================================================

-- ============================================================================
-- INSERT DEMO EVENTS
-- ============================================================================

INSERT INTO events (id, title, description, location, start_date, end_date, image_url, status, total_stalls, available_stalls, price_per_stall) VALUES
(
  'e1111111-1111-1111-1111-111111111111',
  'Tech Innovation Expo 2025',
  'Join us for the biggest technology exhibition of the year! Discover cutting-edge innovations, network with industry leaders, and explore the latest trends in AI, IoT, and sustainable technology. Perfect for startups and established tech companies looking to showcase their products.',
  'Mumbai Convention Center, Bandra Kurla Complex',
  '2025-02-15T09:00:00+05:30',
  '2025-02-17T18:00:00+05:30',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  'published',
  150,
  150,
  25000.00
),
(
  'e2222222-2222-2222-2222-222222222222',
  'Startup Showcase India',
  'The premier platform for Indian startups to present their innovative solutions to investors, mentors, and potential customers. Three days of pitches, networking sessions, and workshops focused on scaling your startup in the Indian market.',
  'Delhi Expo Mart, Greater Noida',
  '2025-03-10T10:00:00+05:30',
  '2025-03-12T17:00:00+05:30',
  'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80',
  'published',
  200,
  200,
  15000.00
),
(
  'e3333333-3333-3333-3333-333333333333',
  'Green Energy Summit 2025',
  'Explore sustainable energy solutions at India''s largest renewable energy exhibition. Featuring solar, wind, and emerging green technologies. Connect with government officials, investors, and sustainability advocates driving India''s clean energy revolution.',
  'Bangalore International Exhibition Centre',
  '2025-04-05T09:00:00+05:30',
  '2025-04-07T18:00:00+05:30',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
  'published',
  120,
  120,
  30000.00
),
(
  'e4444444-4444-4444-4444-444444444444',
  'Digital Marketing Conclave',
  'Master the art of digital marketing in the AI era. Two-day intensive event featuring workshops on SEO, social media marketing, content creation, and influencer partnerships. Network with top marketing agencies and learn from successful brand campaigns.',
  'Hyderabad International Convention Centre',
  '2025-05-20T10:00:00+05:30',
  '2025-05-21T17:00:00+05:30',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
  'published',
  80,
  80,
  12000.00
),
(
  'e5555555-5555-5555-5555-555555555555',
  'Fashion & Lifestyle Expo',
  'India''s most glamorous fashion exhibition showcasing the latest trends in apparel, accessories, beauty, and lifestyle products. Perfect for fashion brands, designers, and retailers. Features runway shows, buyer meetups, and trend forecasting sessions.',
  'Pragati Maidan, New Delhi',
  '2025-06-15T11:00:00+05:30',
  '2025-06-18T20:00:00+05:30',
  'https://images.unsplash.com/photo-1558769132-cb1aea54c7fc?w=800&q=80',
  'draft',
  250,
  250,
  20000.00
);

-- ============================================================================
-- INSERT DEMO STALLS FOR EVENT 1 (Tech Innovation Expo)
-- ============================================================================
-- Creating a 10x15 grid layout (150 stalls total)

DO $$
DECLARE
  v_event_id UUID := 'e1111111-1111-1111-1111-111111111111';
  v_row_letter CHAR(1);
  v_col INTEGER;
  v_stall_number TEXT;
  v_price NUMERIC(10, 2);
  v_features TEXT[];
BEGIN
  FOR i IN 1..15 LOOP
    -- Convert row number to letter (1=A, 2=B, etc.)
    v_row_letter := CHR(64 + ((i - 1) / 10) + 1);
    
    FOR j IN 1..10 LOOP
      v_col := ((i - 1) % 10) + 1;
      v_stall_number := v_row_letter || '-' || LPAD(j::TEXT, 2, '0');
      
      -- Corner stalls are premium (higher price)
      IF (j = 1 OR j = 10) AND (i = 1 OR i = 15) THEN
        v_price := 30000.00;
        v_features := ARRAY['Corner Location', 'High Visibility', 'Premium Spot'];
      -- Front row stalls
      ELSIF i <= 3 THEN
        v_price := 28000.00;
        v_features := ARRAY['Front Row', 'High Traffic'];
      -- Regular stalls
      ELSE
        v_price := 25000.00;
        v_features := ARRAY['Standard Location'];
      END IF;
      
      INSERT INTO stalls (event_id, stall_number, position_x, position_y, price, features)
      VALUES (v_event_id, v_stall_number, j, i, v_price, v_features);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- INSERT DEMO STALLS FOR EVENT 2 (Startup Showcase)
-- ============================================================================
-- Creating a 10x20 grid layout (200 stalls total)

DO $$
DECLARE
  v_event_id UUID := 'e2222222-2222-2222-2222-222222222222';
  v_row_letter CHAR(1);
  v_col INTEGER;
  v_stall_number TEXT;
  v_price NUMERIC(10, 2);
BEGIN
  FOR i IN 1..20 LOOP
    v_row_letter := CHR(64 + ((i - 1) / 10) + 1);
    
    FOR j IN 1..10 LOOP
      v_col := ((i - 1) % 10) + 1;
      v_stall_number := v_row_letter || '-' || LPAD(j::TEXT, 2, '0');
      v_price := 15000.00;
      
      INSERT INTO stalls (event_id, stall_number, position_x, position_y, price)
      VALUES (v_event_id, v_stall_number, j, i, v_price);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- INSERT DEMO STALLS FOR EVENT 3 (Green Energy Summit)
-- ============================================================================
-- Creating a 8x15 grid layout (120 stalls total)

DO $$
DECLARE
  v_event_id UUID := 'e3333333-3333-3333-3333-333333333333';
  v_row_letter CHAR(1);
  v_stall_number TEXT;
  v_price NUMERIC(10, 2);
  v_features TEXT[];
BEGIN
  FOR i IN 1..15 LOOP
    v_row_letter := CHR(64 + ((i - 1) / 10) + 1);
    
    FOR j IN 1..8 LOOP
      v_stall_number := v_row_letter || '-' || LPAD(j::TEXT, 2, '0');
      
      -- Larger booth options for green energy companies
      IF j <= 4 THEN
        v_price := 35000.00;
        v_features := ARRAY['Large Booth', 'Premium Location', 'Power Supply'];
      ELSE
        v_price := 30000.00;
        v_features := ARRAY['Standard Booth', 'Power Supply'];
      END IF;
      
      INSERT INTO stalls (event_id, stall_number, position_x, position_y, price, features)
      VALUES (v_event_id, v_stall_number, j, i, v_price, v_features);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- INSERT DEMO STALLS FOR EVENT 4 (Digital Marketing)
-- ============================================================================
-- Creating a 8x10 grid layout (80 stalls total)

DO $$
DECLARE
  v_event_id UUID := 'e4444444-4444-4444-4444-444444444444';
  v_row_letter CHAR(1);
  v_stall_number TEXT;
  v_price NUMERIC(10, 2);
BEGIN
  FOR i IN 1..10 LOOP
    v_row_letter := CHR(64 + ((i - 1) / 10) + 1);
    
    FOR j IN 1..8 LOOP
      v_stall_number := v_row_letter || '-' || LPAD(j::TEXT, 2, '0');
      v_price := 12000.00;
      
      INSERT INTO stalls (event_id, stall_number, position_x, position_y, price)
      VALUES (v_event_id, v_stall_number, j, i, v_price);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- UPDATE TOTAL STALLS COUNT
-- ============================================================================
-- The triggers will automatically update available_stalls, but we need to
-- update total_stalls to match the actual number created

UPDATE events SET total_stalls = (SELECT COUNT(*) FROM stalls WHERE event_id = events.id);

-- ============================================================================
-- SAMPLE BOOKINGS (Optional - Uncomment after creating user accounts)
-- ============================================================================
-- After you create the demo user accounts via signup, you can run these
-- INSERT statements to create sample bookings. Replace the user_id values
-- with the actual UUIDs from auth.users table.

/*
-- Get user IDs first:
-- SELECT id, email FROM auth.users;

-- Example booking 1 (Replace USER_ID_1 with actual UUID)
INSERT INTO bookings (event_id, stall_id, user_id, status, payment_status, amount)
SELECT 
  'e1111111-1111-1111-1111-111111111111',
  id,
  'USER_ID_1',
  'confirmed',
  'paid',
  25000.00
FROM stalls 
WHERE event_id = 'e1111111-1111-1111-1111-111111111111' 
  AND stall_number = 'A-05'
LIMIT 1;

-- Update stall status to booked
UPDATE stalls 
SET status = 'booked' 
WHERE event_id = 'e1111111-1111-1111-1111-111111111111' 
  AND stall_number = 'A-05';

-- Create payment record (Replace USER_ID_1 and BOOKING_ID with actual values)
INSERT INTO payments (booking_id, user_id, razorpay_payment_id, razorpay_order_id, amount, status, method)
VALUES (
  'BOOKING_ID',
  'USER_ID_1',
  'pay_demo_' || substr(md5(random()::text), 1, 16),
  'order_demo_' || substr(md5(random()::text), 1, 16),
  25000.00,
  'captured',
  'upi'
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the data was inserted correctly

-- Check events
SELECT id, title, status, total_stalls, available_stalls, price_per_stall FROM events;

-- Check stalls count per event
SELECT 
  e.title,
  COUNT(s.id) as total_stalls,
  COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available_stalls,
  COUNT(CASE WHEN s.status = 'booked' THEN 1 END) as booked_stalls
FROM events e
LEFT JOIN stalls s ON e.id = s.event_id
GROUP BY e.id, e.title
ORDER BY e.start_date;

-- Check stall distribution
SELECT event_id, MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price
FROM stalls
GROUP BY event_id;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create demo user accounts via the mobile app signup
-- 2. Update the mobile app to use real API calls
-- 3. Set up the admin dashboard
-- ============================================================================
