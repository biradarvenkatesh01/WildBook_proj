-- ==============================================================================
-- WildBook: 05_seed.sql
-- Seed Data for Development, Testing & Demonstration
-- Passwords:
--   owner@wildbook.com:          Owner@123
--   admin.nagarhole@wildbook.com: Admin@123
--   admin.bandipur@wildbook.com:  Admin@123
--   visitor@wildbook.com:        Visitor@123
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payments;
TRUNCATE TABLE bookings;
TRUNCATE TABLE slots;
TRUNCATE TABLE vehicles;
TRUNCATE TABLE guides;
TRUNCATE TABLE activities;
TRUNCATE TABLE sanctuaries;
TRUNCATE TABLE admin_profiles;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------------------------
INSERT INTO users (
  user_id, name, email, phone, password_hash, role, account_status, reviewed_by, reviewed_at, review_note, profile_image, created_at
) VALUES
-- 1: Site Owner (no signup route, created at system genesis)
(
  1, 
  'Site Owner', 
  'owner@wildbook.com', 
  '+91 98888 00001', 
  '$2b$10$hFLN3Ffj6vtuSCPdWoKmSuj/KeH5V7CwgV5HDKNjYkQdiQSdyIbaa', 
  'SITE_OWNER', 
  'APPROVED', 
  NULL, 
  NOW(), 
  'Genesis administrator account', 
  '/avatars/owner.jpg', 
  '2026-01-01 00:00:00'
),
-- 2: Approved Sanctuary Admin (Nagarhole)
(
  2, 
  'Rajesh Sharma', 
  'admin.nagarhole@wildbook.com', 
  '+91 94480 11223', 
  '$2b$10$q8WoktJADk.7PtVNIQs1yep2ff36.WlwxW2jt2vihjl1VHL63XmlS', 
  'ADMIN', 
  'APPROVED', 
  1, 
  '2026-01-10 10:00:00', 
  'Verified government wildlife authority credentials', 
  '/avatars/admin1.jpg', 
  '2026-01-05 09:30:00'
),
-- 3: Pending Sanctuary Admin (Bandipur Trust - awaiting review)
(
  3, 
  'Ananya Deshmukh', 
  'admin.bandipur@wildbook.com', 
  '+91 98450 33445', 
  '$2b$10$q8WoktJADk.7PtVNIQs1yep2ff36.WlwxW2jt2vihjl1VHL63XmlS', 
  'ADMIN', 
  'PENDING', 
  NULL, 
  NULL, 
  NULL, 
  '/avatars/admin2.jpg', 
  '2026-10-15 14:00:00'
),
-- 4: Visitor
(
  4, 
  'Pooja Hegde', 
  'visitor@wildbook.com', 
  '+91 97401 55667', 
  '$2b$10$.OUYdlTufxlb.4lYnZgHl.F.PYj0S98AJB3vIiKZILMFIjSgsWQUO', 
  'VISITOR', 
  'APPROVED', 
  NULL, 
  NOW(), 
  NULL, 
  '/avatars/visitor1.jpg', 
  '2026-02-01 11:20:00'
);

-- ------------------------------------------------------------------------------
-- 2. ADMIN_PROFILES
-- ------------------------------------------------------------------------------
INSERT INTO admin_profiles (
  user_id, organisation_name, license_number, designation, registered_address, website, license_doc, identity_doc, auth_letter_doc
) VALUES
(
  2, 
  'Karnataka Forest & Wildlife Department', 
  'KA-WLD-2024-001', 
  'Chief Conservator & Field Director', 
  'Vanavikas Bhavan, Malleshwaram, Bengaluru, Karnataka - 560003', 
  'https://aranya.gov.in', 'uploads/admin-docs/admin_2_license.pdf', 'uploads/admin-docs/admin_2_identity.pdf', 'uploads/admin-docs/admin_2_authorization.pdf'
),
(
  3, 
  'Bandipur Eco-Tourism Conservation Trust', 
  'KA-WLD-2024-009', 
  'General Manager - Safari Operations', 
  'Bandipur National Park Campus, Gundlupet Taluk, Chamarajanagar - 571126', 
  'https://bandipurtigerreserve.in', 'uploads/admin-docs/admin_3_license.pdf', 'uploads/admin-docs/admin_3_identity.pdf', 'uploads/admin-docs/admin_3_authorization.pdf'
);

-- ------------------------------------------------------------------------------
-- 4. SANCTUARIES
-- ------------------------------------------------------------------------------
INSERT INTO sanctuaries (
  sanctuary_id, admin_id, name, location, description, cover_image, average_rating, total_reviews, contact_email, contact_phone, website, opening_time, closing_time, operating_days, best_time_to_visit, latitude, longitude, listing_status, review_note, reviewed_by, reviewed_at, created_at
) VALUES
(
  1, 
  2, 
  'Nagarhole National Park (Kabini Reserve)', 
  'Kodagu & Mysuru Districts, Karnataka', 
  'Spread across lush foothills of the Western Ghats, Nagarhole is famed for one of India’s highest predator densities including Bengal tigers, leopards, and massive herds of Asiatic elephants wandering along the tranquil waters of the Kabini River.', 
  'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80', 5.0, 1,
  'nagarhole.safari@wildbook.com', 
  '+91 821 2480901', 
  'https://nagarholetigerreserve.org', 
  '06:00:00', 
  '18:30:00', 
  'Monday to Sunday (Year-round)', 
  'October to May', 
  11.9961540, 
  76.1265840, 
  'APPROVED', 
  'Verified official sanctuary listing with forest department approvals', 
  1, 
  '2026-01-12 11:00:00', 
  '2026-01-11 10:00:00'
),
(
  2, 
  2, 
  'Bandipur Tiger Reserve & National Park', 
  'Chamarajanagar District, Karnataka', 
  'Part of the Nilgiri Biosphere Reserve, Bandipur connects with Mudumalai and Wayanad to form a critical wildlife corridor protecting tigers, dholes, sloth bears, Indian gaurs, and over 200 species of vibrant birds.', 
  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80', 5.0, 1,
  'bandipur.safari@wildbook.com', 
  '+91 8229 236043', 
  'https://bandipurtigerreserve.in', 
  '06:00:00', 
  '18:00:00', 
  'Monday to Sunday (Year-round)', 
  'November to April', 
  11.6663890, 
  76.6288890, 
  'APPROVED', 
  'Approved reserve listing managed under Karnataka Wildlife circle', 
  1, 
  '2026-01-15 14:00:00', 
  '2026-01-14 12:00:00'
);

-- ------------------------------------------------------------------------------
-- 6. ACTIVITIES
-- ------------------------------------------------------------------------------
INSERT INTO activities (
  activity_id, sanctuary_id, activity_name, description, duration_minutes, what_to_carry, price, is_active
) VALUES
(1, 1, 'Morning 4x4 Jeep Safari (Zone A)', 'Guided open jeep excursion deep inside the core teak jungle during peak predator activity hours.', 180, 'Camera, binocular, government photo ID, neutral colored clothes', 1800.00, TRUE),
(2, 1, 'Kabini River Sunset Boat Safari', 'Cruising along the Kabini backwaters witnessing herds of elephants bathing and marsh crocodiles basking.', 120, 'Binoculars, waterproof jacket, photo ID', 1500.00, TRUE),
(3, 1, 'Guided Bird Watching Nature Walk', 'Early dawn walk along peripheral forest tracks guided by certified ornithologist.', 150, 'Walking boots, telephoto lens, field guide', 800.00, TRUE),
(4, 2, 'Bandipur Tiger Trail Jeep Safari', 'Exclusive tracker-guided safari covering the central Moyar valley and waterholes.', 180, 'ID proof, sunscreen, dust scarf, telephoto lens', 2000.00, TRUE),
(5, 2, 'Wilderness Canter Forest Safari', 'Budget-friendly 20-seater open forest bus safari exploring the northern tourism zone.', 120, 'ID proof, water bottle, cap', 600.00, TRUE);

-- ------------------------------------------------------------------------------
-- 7. GUIDES
-- ------------------------------------------------------------------------------
INSERT INTO guides (
  guide_id, sanctuary_id, name, phone, experience
) VALUES
(1, 1, 'Mahesh Gowda', '+91 94481 22334', 8),
(2, 1, 'Suresh Kariappa', '+91 94482 33445', 12),
(3, 1, 'Praveen Somanna', '+91 94483 44556', 5),
(4, 2, 'Ramesh Nayak', '+91 98861 55667', 10),
(5, 2, 'Chethan Kumar', '+91 98862 66778', 6);

-- ------------------------------------------------------------------------------
-- 8. VEHICLES
-- ------------------------------------------------------------------------------
INSERT INTO vehicles (
  vehicle_id, sanctuary_id, vehicle_type, capacity
) VALUES
(1, 1, 'Open 4x4 Safari Gypsy (KA-09-EA-1020)', 6),
(2, 1, 'Kabini Safari Motor Boat (KB-BT-01)', 15),
(3, 1, 'Forest Canter Bus (KA-09-M-4450)', 20),
(4, 2, 'Open 4x4 Safari Gypsy (KA-11-Z-3311)', 6),
(5, 2, 'Tourism Canter Vehicle (KA-11-C-8822)', 18);

-- ------------------------------------------------------------------------------
-- 9. SLOTS
-- (Includes a past slot for review testing, and future slots for reservations)
-- ------------------------------------------------------------------------------
INSERT INTO slots (
  slot_id, activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active
) VALUES
-- Past slot (used for verified review demonstration): 2026-03-10
(1, 1, 1, 1, '2026-03-10', '06:00:00', 6, TRUE),

-- Future slots for Nagarhole Jeep Safari
(2, 1, 1, 1, '2026-11-20', '06:00:00', 6, TRUE),
(3, 1, 2, 1, '2026-11-20', '15:30:00', 6, TRUE),

-- Future slot for Kabini Boat Safari (capacity 15)
(4, 2, 3, 2, '2026-11-20', '16:00:00', 15, TRUE),

-- Future slots for Bandipur Safari
(5, 4, 4, 4, '2026-11-21', '06:30:00', 6, TRUE),
(6, 5, 5, 5, '2026-11-21', '15:30:00', 18, TRUE);

-- ------------------------------------------------------------------------------
-- 10. BOOKINGS, ATTENDEES, PAYMENTS & REVIEWS
-- ------------------------------------------------------------------------------

-- Past confirmed booking for visitor 4 on slot 1
INSERT INTO bookings (
  booking_id, booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at, booked_at, cancelled_at, cancellation_reason, cancellation_fee, refund_amount
) VALUES (
  1, 'WB-PAST0001', 4, 1, 2, 'CONFIRMED', 3600.00, NULL, '2026-03-01 10:00:00', NULL, NULL, 0.00, 0.00
);


INSERT INTO payments (
  payment_id, booking_id, amount, payment_status, transaction_ref, paid_at
) VALUES (
  1, 1, 3600.00, 'PAID', 'tx_test_past_3600_01', '2026-03-01 10:05:00'
);

-- Legitimate review for the past confirmed booking

-- Future confirmed booking on slot 2 (2 seats taken out of 6)
INSERT INTO bookings (
  booking_id, booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at, booked_at, cancelled_at, cancellation_reason, cancellation_fee, refund_amount
) VALUES (
  2, 'WB-FUT00002', 4, 2, 2, 'CONFIRMED', 3600.00, NULL, NOW(), NULL, NULL, 0.00, 0.00
);


INSERT INTO payments (
  payment_id, booking_id, amount, payment_status, transaction_ref, paid_at
) VALUES (
  2, 2, 3600.00, 'PAID', 'tx_test_fut_3600_02', NOW()
);
