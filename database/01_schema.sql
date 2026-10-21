-- ==============================================================================
-- WildBook: 01_schema.sql
-- Normalized 3NF/BCNF Schema for Wildlife Sanctuary & Safari Reservation System
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS cancellations;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booking_attendees;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS guides;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS sanctuary_images;
DROP TABLE IF EXISTS sanctuaries;
DROP TABLE IF EXISTS admin_documents;
DROP TABLE IF EXISTS admin_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS: visitors, administrators, and the site owner
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('VISITOR', 'ADMIN', 'SITE_OWNER') NOT NULL DEFAULT 'VISITOR',
  account_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'APPROVED',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  review_note TEXT NULL,
  profile_image VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_reviewed_by FOREIGN KEY (reviewed_by) 
    REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ADMIN_PROFILES: 1:1 metadata for sanctuary administrators
CREATE TABLE admin_profiles (
  user_id INT PRIMARY KEY,
  organisation_name VARCHAR(150) NOT NULL,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  designation VARCHAR(100) NOT NULL,
  registered_address TEXT NOT NULL,
  website VARCHAR(255) NULL,
  CONSTRAINT fk_admin_profiles_user FOREIGN KEY (user_id) 
    REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ADMIN_DOCUMENTS: verification documents submitted during admin onboarding
CREATE TABLE admin_documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  doc_type ENUM('LICENSE', 'IDENTITY', 'AUTHORIZATION') NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_documents_admin FOREIGN KEY (admin_id) 
    REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SANCTUARIES: wildlife parks and reserves managed by approved admins
CREATE TABLE sanctuaries (
  sanctuary_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  contact_email VARCHAR(150) NULL,
  contact_phone VARCHAR(20) NULL,
  website VARCHAR(255) NULL,
  opening_time TIME NULL,
  closing_time TIME NULL,
  operating_days VARCHAR(100) NULL,
  best_time_to_visit VARCHAR(100) NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  listing_status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  review_note TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sanctuaries_admin FOREIGN KEY (admin_id) 
    REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_sanctuaries_reviewed_by FOREIGN KEY (reviewed_by) 
    REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SANCTUARY_IMAGES: gallery and cover photos (CASCADE DELETE PERMITTED)
CREATE TABLE sanctuary_images (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  sanctuary_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sanctuary_images_sanctuary FOREIGN KEY (sanctuary_id) 
    REFERENCES sanctuaries(sanctuary_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ACTIVITIES: safaris, boat tours, birding expeditions offered by sanctuaries
CREATE TABLE activities (
  activity_id INT AUTO_INCREMENT PRIMARY KEY,
  sanctuary_id INT NOT NULL,
  activity_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  duration_minutes INT NOT NULL,
  what_to_carry TEXT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_activity_duration CHECK (duration_minutes > 0),
  CONSTRAINT chk_activity_price CHECK (price >= 0),
  CONSTRAINT fk_activities_sanctuary FOREIGN KEY (sanctuary_id) 
    REFERENCES sanctuaries(sanctuary_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. GUIDES: naturalist guides employed at a specific sanctuary
CREATE TABLE guides (
  guide_id INT AUTO_INCREMENT PRIMARY KEY,
  sanctuary_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  experience INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_guide_experience CHECK (experience >= 0),
  CONSTRAINT fk_guides_sanctuary FOREIGN KEY (sanctuary_id) 
    REFERENCES sanctuaries(sanctuary_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. VEHICLES: safari jeeps, canters, and boats belonging to a sanctuary
CREATE TABLE vehicles (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  sanctuary_id INT NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  CONSTRAINT chk_vehicle_capacity CHECK (capacity > 0),
  CONSTRAINT fk_vehicles_sanctuary FOREIGN KEY (sanctuary_id) 
    REFERENCES sanctuaries(sanctuary_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SLOTS: specific scheduled sessions for an activity, guide, and vehicle
CREATE TABLE slots (
  slot_id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  guide_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  capacity INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_slot_capacity CHECK (capacity > 0),
  CONSTRAINT uq_slot_guide UNIQUE (guide_id, slot_date, slot_time),
  CONSTRAINT uq_slot_vehicle UNIQUE (vehicle_id, slot_date, slot_time),
  CONSTRAINT fk_slots_activity FOREIGN KEY (activity_id) 
    REFERENCES activities(activity_id) ON DELETE RESTRICT,
  CONSTRAINT fk_slots_guide FOREIGN KEY (guide_id) 
    REFERENCES guides(guide_id) ON DELETE RESTRICT,
  CONSTRAINT fk_slots_vehicle FOREIGN KEY (vehicle_id) 
    REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BOOKINGS: customer reservations linking users and slots
CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  slot_id INT NOT NULL,
  number_of_people INT NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  total_amount DECIMAL(10, 2) NOT NULL,
  hold_expires_at DATETIME NULL,
  booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_booking_people CHECK (number_of_people > 0),
  CONSTRAINT chk_booking_amount CHECK (total_amount >= 0),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) 
    REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_slot FOREIGN KEY (slot_id) 
    REFERENCES slots(slot_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BOOKING_ATTENDEES: individual passenger details (CASCADE DELETE PERMITTED)
CREATE TABLE booking_attendees (
  attendee_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  id_type VARCHAR(50) NOT NULL,
  id_number VARCHAR(100) NOT NULL,
  CONSTRAINT chk_attendee_age CHECK (age > 0),
  CONSTRAINT fk_booking_attendees_booking FOREIGN KEY (booking_id) 
    REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. PAYMENTS: 1:1 payment record per booking
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
  transaction_ref VARCHAR(100) NULL,
  paid_at DATETIME NULL,
  CONSTRAINT chk_payment_amount CHECK (amount >= 0),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
    REFERENCES bookings(booking_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. CANCELLATIONS: cancellation fee breakdown for confirmed bookings
CREATE TABLE cancellations (
  cancellation_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  cancelled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount_paid DECIMAL(10, 2) NOT NULL,
  fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
  fee_amount DECIMAL(10, 2) NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  CONSTRAINT chk_cancel_amounts CHECK (amount_paid >= 0 AND fee_amount >= 0 AND refund_amount >= 0),
  CONSTRAINT fk_cancellations_booking FOREIGN KEY (booking_id) 
    REFERENCES bookings(booking_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. REVIEWS: visitor ratings for completed visits
CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  sanctuary_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) 
    REFERENCES bookings(booking_id) ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) 
    REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_sanctuary FOREIGN KEY (sanctuary_id) 
    REFERENCES sanctuaries(sanctuary_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INDEXES FOR PERFORMANCE (Per project.md Section 5 / Phase 1)
-- ==============================================================================

CREATE INDEX idx_slots_slot_date ON slots(slot_date);
CREATE INDEX idx_activities_sanctuary_id ON activities(sanctuary_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_slot_status ON bookings(slot_id, status);
CREATE INDEX idx_sanctuaries_listing_status ON sanctuaries(listing_status);
