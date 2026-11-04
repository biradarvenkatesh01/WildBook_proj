-- ==============================================================================
-- WildBook: 04_views.sql (Optimized 9-Table Views)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. VIEW: v_public_sanctuaries
-- Approved sanctuaries with direct cover image and ratings
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_public_sanctuaries AS
SELECT 
  s.sanctuary_id,
  s.name,
  s.location,
  s.description,
  s.contact_email,
  s.contact_phone,
  s.website,
  s.opening_time,
  s.closing_time,
  s.operating_days,
  s.best_time_to_visit,
  s.latitude,
  s.longitude,
  s.cover_image,
  s.average_rating,
  s.total_reviews,
  s.created_at
FROM sanctuaries s
WHERE s.listing_status = 'APPROVED';

-- ------------------------------------------------------------------------------
-- 2. VIEW: v_slot_availability
-- Active slots with dynamic capacity, confirmed bookings + unexpired holds, and seats left
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_slot_availability AS
SELECT 
  sl.slot_id,
  sl.activity_id,
  a.activity_name,
  a.price,
  a.duration_minutes,
  sa.sanctuary_id,
  sa.name AS sanctuary_name,
  sa.location AS sanctuary_location,
  sl.guide_id,
  g.name AS guide_name,
  sl.vehicle_id,
  v.vehicle_type,
  sl.slot_date,
  sl.slot_time,
  sl.capacity AS total_capacity,
  COALESCE((
    SELECT SUM(b.number_of_people)
    FROM bookings b
    WHERE b.slot_id = sl.slot_id
      AND (b.status = 'CONFIRMED' OR (b.status = 'PENDING' AND b.hold_expires_at > NOW()))
  ), 0) AS booked_seats,
  (
    sl.capacity - COALESCE((
      SELECT SUM(b.number_of_people)
      FROM bookings b
      WHERE b.slot_id = sl.slot_id
        AND (b.status = 'CONFIRMED' OR (b.status = 'PENDING' AND b.hold_expires_at > NOW()))
    ), 0)
  ) AS available_seats,
  sl.is_active
FROM slots sl
JOIN activities a ON sl.activity_id = a.activity_id
JOIN sanctuaries sa ON a.sanctuary_id = sa.sanctuary_id
JOIN guides g ON sl.guide_id = g.guide_id
JOIN vehicles v ON sl.vehicle_id = v.vehicle_id
WHERE sl.is_active = TRUE AND a.is_active = TRUE AND sa.listing_status = 'APPROVED';

-- ------------------------------------------------------------------------------
-- 3. VIEW: v_confirmed_bookings
-- Comprehensive reporting view for completed and verified bookings
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_confirmed_bookings AS
SELECT 
  b.booking_id,
  b.booking_code,
  b.user_id,
  u.name AS visitor_name,
  u.email AS visitor_email,
  u.phone AS visitor_phone,
  sa.sanctuary_id,
  sa.name AS sanctuary_name,
  a.activity_id,
  a.activity_name,
  sl.slot_id,
  sl.slot_date,
  sl.slot_time,
  g.name AS guide_name,
  v.vehicle_type,
  b.number_of_people,
  b.total_amount,
  p.payment_status,
  p.transaction_ref,
  b.booked_at
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN slots sl ON b.slot_id = sl.slot_id
JOIN activities a ON sl.activity_id = a.activity_id
JOIN sanctuaries sa ON a.sanctuary_id = sa.sanctuary_id
JOIN guides g ON sl.guide_id = g.guide_id
JOIN vehicles v ON sl.vehicle_id = v.vehicle_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE b.status = 'CONFIRMED';
