-- ============================================================================
-- SEED DATA FOR HALLS (H2, H3, H7)
-- ============================================================================
-- Run this after 04_add_halls_support.sql
-- Make sure to replace 'YOUR_EVENT_ID' with actual event ID from events table
-- ============================================================================

-- Get the event ID (update this after running 02_seed_data.sql)
-- SELECT id FROM events LIMIT 1;

-- For this example, we'll use a variable. Replace with your actual event ID
DO $$
DECLARE
  v_event_id UUID;
  v_base_price NUMERIC := 25000;
  v_premium_price NUMERIC := 35000;
  v_corner_price NUMERIC := 45000;
BEGIN
  -- Get first event ID (or create one if needed)
  SELECT id INTO v_event_id FROM events ORDER BY created_at DESC LIMIT 1;
  
  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'No event found. Please run 02_seed_data.sql first';
  END IF;

  -- ============================================================================
  -- INSERT HALLS
  -- ============================================================================
  
  INSERT INTO halls (id, event_id, name, layout_type, color_theme, total_stalls, display_order) VALUES
  ('H2', v_event_id, 'Hall H2 - Live Machine', 'double_column_walkway', '#D4E8D4', 36, 1),
  ('H3', v_event_id, 'Hall H3 - Central Plaza', 't_shape_complex', '#F5D0C5', 45, 2),
  ('H7', v_event_id, 'Hall H7 - Premium Zone', 'u_shape_with_center', '#B4E5F0', 68, 3);

  -- ============================================================================
  -- HALL H2 STALLS - Double Column Layout
  -- ============================================================================
  
  -- Left Column (18 stalls)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H2',
    'H2-L' || LPAD(generate_series::TEXT, 2, '0'),
    0,  -- column 0
    generate_series - 1,  -- rows 0-17
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(1, 18);

  -- Right Column (18 stalls)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H2',
    'H2-R' || LPAD(generate_series::TEXT, 2, '0'),
    2,  -- column 2
    generate_series - 1,  -- rows 0-17
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(1, 18);

  -- ============================================================================
  -- HALL H3 STALLS - T-Shape Complex Layout
  -- ============================================================================
  
  -- Left Column (16 stalls)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H3',
    'H3-L' || LPAD(generate_series::TEXT, 2, '0'),
    0,
    generate_series - 1,
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(1, 16);

  -- Center Top Section (21 stalls - 3 columns × 7 rows)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H3',
    'H3-CT' || LPAD(((row_num * 3) + col_num + 1)::TEXT, 2, '0'),
    col_num + 2,  -- columns 2, 3, 4
    row_num,      -- rows 0-6
    1,
    1,
    'available',
    v_premium_price,
    ARRAY['Premium Location', 'Power Supply', 'WiFi', 'Extra Space']
  FROM generate_series(0, 6) AS row_num
  CROSS JOIN generate_series(0, 2) AS col_num;

  -- Center Bottom (6 stalls - 2 columns on left and right)
  -- Center Bottom Left
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H3',
    'H3-CBL' || LPAD(generate_series::TEXT, 2, '0'),
    2,
    9 + generate_series,
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(0, 2);

  -- Center Bottom Right
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H3',
    'H3-CBR' || LPAD(generate_series::TEXT, 2, '0'),
    4,
    9 + generate_series,
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(0, 2);

  -- Right Column (16 stalls)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H3',
    'H3-R' || LPAD(generate_series::TEXT, 2, '0'),
    6,
    generate_series - 1,
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(1, 16);

  -- ============================================================================
  -- HALL H7 STALLS - U-Shape with Center Columns
  -- ============================================================================
  
  -- Top Row Merged Left Corner (1 stall, 3-wide)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  VALUES (
    v_event_id,
    'H7',
    'H7-TL',
    0,
    0,
    3,
    1,
    'available',
    v_corner_price,
    ARRAY['Corner Premium', 'Triple Width', 'Power Supply', 'WiFi', 'Premium Display']
  );

  -- Top Row Single Stalls (6 stalls)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H7',
    'H7-T' || LPAD(generate_series::TEXT, 2, '0'),
    2 + generate_series,  -- columns 3-8
    0,
    1,
    1,
    'available',
    v_premium_price,
    ARRAY['Top Row', 'High Visibility', 'Power Supply', 'WiFi']
  FROM generate_series(1, 6);

  -- Top Row Merged Right Corner (1 stall, 3-wide)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  VALUES (
    v_event_id,
    'H7',
    'H7-TR',
    9,
    0,
    3,
    1,
    'available',
    v_corner_price,
    ARRAY['Corner Premium', 'Triple Width', 'Power Supply', 'WiFi', 'Premium Display']
  );

  -- Left Column (18 stalls)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H7',
    'H7-L' || LPAD(generate_series::TEXT, 2, '0'),
    1,
    generate_series,  -- rows 1-18
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(1, 18);

  -- Center-Left Column (14 stalls, starting from row 3)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H7',
    'H7-CL' || LPAD(generate_series::TEXT, 2, '0'),
    4,
    2 + generate_series,  -- rows 3-16
    1,
    1,
    'available',
    v_premium_price,
    ARRAY['Center Location', 'High Traffic', 'Power Supply', 'WiFi']
  FROM generate_series(1, 14);

  -- Center-Right Column (14 stalls, starting from row 3)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H7',
    'H7-CR' || LPAD(generate_series::TEXT, 2, '0'),
    6,
    2 + generate_series,  -- rows 3-16
    1,
    1,
    'available',
    v_premium_price,
    ARRAY['Center Location', 'High Traffic', 'Power Supply', 'WiFi']
  FROM generate_series(1, 14);

  -- Right Column (18 stalls)
  INSERT INTO stalls (event_id, hall_id, stall_number, position_x, position_y, width, height, status, price, features)
  SELECT 
    v_event_id,
    'H7',
    'H7-R' || LPAD(generate_series::TEXT, 2, '0'),
    9,
    generate_series,  -- rows 1-18
    1,
    1,
    'available',
    v_base_price,
    ARRAY['Standard Size', 'Power Supply', 'WiFi']
  FROM generate_series(1, 18);

  RAISE NOTICE 'Successfully created halls and stalls for event %', v_event_id;
END $$;

-- Verify the stalls count
SELECT 
  h.id,
  h.name,
  h.total_stalls AS expected,
  COUNT(s.id) AS actual
FROM halls h
LEFT JOIN stalls s ON s.hall_id = h.id
GROUP BY h.id, h.name, h.total_stalls
ORDER BY h.display_order;
