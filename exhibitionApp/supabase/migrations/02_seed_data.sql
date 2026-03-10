-- Exhibition Booking App - Seed Data
-- Generated: 2025-11-28

-- =====================================================
-- SEED EVENTS
-- Demo exhibition events
-- =====================================================

INSERT INTO public.events (id, title, description, location, start_date, end_date, status, total_stalls, available_stalls, price_per_stall) VALUES
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Tech Expo 2025',
    'Annual technology and innovation exhibition showcasing cutting-edge gadgets, software solutions, and emerging tech trends. Perfect for tech startups and established companies.',
    'Mumbai Convention Center, Bandra Kurla Complex',
    '2025-12-15 09:00:00+05:30',
    '2025-12-18 18:00:00+05:30',
    'published',
    150,
    150,
    25000.00
  ),
  (
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
    'Startup Showcase India',
    'Premier platform for startups to showcase their products, network with investors, and gain media exposure. Featuring pitch competitions and mentorship sessions.',
    'Bangalore International Exhibition Centre',
    '2025-12-20 10:00:00+05:30',
    '2025-12-22 19:00:00+05:30',
    'published',
    100,
    100,
    18000.00
  ),
  (
    'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f',
    'Green Energy Summit',
    'Sustainable energy solutions and environmental technologies expo. Focus on solar, wind, EV charging, and renewable energy innovations for a greener future.',
    'Delhi Pragati Maidan',
    '2026-01-10 09:00:00+05:30',
    '2026-01-13 17:00:00+05:30',
    'published',
    120,
    120,
    22000.00
  ),
  (
    'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
    'Fashion & Lifestyle Expo',
    'Glamorous exhibition for fashion designers, lifestyle brands, beauty products, and accessories. Runway shows, celebrity appearances, and exclusive launches.',
    'Hyderabad Hitex Exhibition Centre',
    '2026-01-25 11:00:00+05:30',
    '2026-01-28 20:00:00+05:30',
    'published',
    180,
    180,
    30000.00
  ),
  (
    'e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b',
    'Food & Beverage Festival',
    'Culinary extravaganza featuring restaurants, food trucks, beverage brands, and cooking demonstrations. Live tastings, chef competitions, and food innovation awards.',
    'Pune Seasons Mall Convention Hall',
    '2026-02-05 12:00:00+05:30',
    '2026-02-08 21:00:00+05:30',
    'published',
    100,
    100,
    20000.00
  );

-- =====================================================
-- SEED STALLS
-- Generate stalls for each event
-- =====================================================

-- Tech Expo 2025 (150 stalls - 15 rows x 10 columns)
INSERT INTO public.stalls (event_id, stall_number, position_x, position_y, width, height, status, price, features)
SELECT 
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'T' || LPAD((row_num * 10 + col_num)::TEXT, 3, '0'),
  col_num,
  row_num,
  1,
  1,
  'available',
  CASE 
    WHEN row_num <= 2 THEN 35000.00  -- Front rows premium
    WHEN col_num IN (0, 9) THEN 30000.00  -- Corner stalls
    ELSE 25000.00
  END,
  CASE 
    WHEN row_num <= 2 THEN ARRAY['premium', 'front-row', 'high-visibility']
    WHEN col_num IN (0, 9) THEN ARRAY['corner-stall', 'dual-access']
    ELSE ARRAY['standard']
  END
FROM generate_series(0, 14) AS row_num
CROSS JOIN generate_series(0, 9) AS col_num;

-- Startup Showcase India (100 stalls - 10 rows x 10 columns)
INSERT INTO public.stalls (event_id, stall_number, position_x, position_y, width, height, status, price, features)
SELECT 
  'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
  'S' || LPAD((row_num * 10 + col_num)::TEXT, 3, '0'),
  col_num,
  row_num,
  1,
  1,
  'available',
  CASE 
    WHEN row_num <= 1 THEN 25000.00
    WHEN col_num IN (0, 9) THEN 22000.00
    ELSE 18000.00
  END,
  CASE 
    WHEN row_num <= 1 THEN ARRAY['premium', 'investor-facing']
    ELSE ARRAY['standard']
  END
FROM generate_series(0, 9) AS row_num
CROSS JOIN generate_series(0, 9) AS col_num;

-- Green Energy Summit (120 stalls - 12 rows x 10 columns)
INSERT INTO public.stalls (event_id, stall_number, position_x, position_y, width, height, status, price, features)
SELECT 
  'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f',
  'G' || LPAD((row_num * 10 + col_num)::TEXT, 3, '0'),
  col_num,
  row_num,
  1,
  1,
  'available',
  CASE 
    WHEN row_num <= 2 THEN 28000.00
    ELSE 22000.00
  END,
  ARRAY['standard', 'eco-friendly']
FROM generate_series(0, 11) AS row_num
CROSS JOIN generate_series(0, 9) AS col_num;

-- Fashion & Lifestyle Expo (180 stalls - 18 rows x 10 columns)
INSERT INTO public.stalls (event_id, stall_number, position_x, position_y, width, height, status, price, features)
SELECT 
  'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
  'F' || LPAD((row_num * 10 + col_num)::TEXT, 3, '0'),
  col_num,
  row_num,
  1,
  1,
  'available',
  CASE 
    WHEN row_num <= 2 THEN 40000.00
    WHEN col_num IN (0, 9) THEN 35000.00
    ELSE 30000.00
  END,
  CASE 
    WHEN row_num <= 2 THEN ARRAY['premium', 'runway-view', 'vip']
    ELSE ARRAY['standard']
  END
FROM generate_series(0, 17) AS row_num
CROSS JOIN generate_series(0, 9) AS col_num;

-- Food & Beverage Festival (100 stalls - 10 rows x 10 columns)
INSERT INTO public.stalls (event_id, stall_number, position_x, position_y, width, height, status, price, features)
SELECT 
  'e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b',
  'FB' || LPAD((row_num * 10 + col_num)::TEXT, 2, '0'),
  col_num,
  row_num,
  1,
  1,
  'available',
  CASE 
    WHEN row_num <= 1 THEN 28000.00
    ELSE 20000.00
  END,
  CASE 
    WHEN row_num <= 1 THEN ARRAY['premium', 'main-entrance', 'high-footfall']
    ELSE ARRAY['standard', 'food-court-access']
  END
FROM generate_series(0, 9) AS row_num
CROSS JOIN generate_series(0, 9) AS col_num;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify seed data
-- =====================================================

-- Total stalls per event
-- SELECT 
--   e.title,
--   e.total_stalls,
--   COUNT(s.id) as actual_stalls,
--   e.available_stalls
-- FROM public.events e
-- LEFT JOIN public.stalls s ON e.id = s.event_id
-- GROUP BY e.id, e.title, e.total_stalls, e.available_stalls
-- ORDER BY e.start_date;

-- Stall status distribution
-- SELECT 
--   e.title,
--   s.status,
--   COUNT(*) as count
-- FROM public.events e
-- JOIN public.stalls s ON e.id = s.event_id
-- GROUP BY e.id, e.title, s.status
-- ORDER BY e.title, s.status;

-- Price range per event
-- SELECT 
--   e.title,
--   MIN(s.price) as min_price,
--   MAX(s.price) as max_price,
--   AVG(s.price)::DECIMAL(10,2) as avg_price
-- FROM public.events e
-- JOIN public.stalls s ON e.id = s.event_id
-- GROUP BY e.id, e.title
-- ORDER BY e.start_date;
