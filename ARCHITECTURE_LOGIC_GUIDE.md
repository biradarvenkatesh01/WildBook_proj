# WildBook — Architecture, File Guide & Viva Defense Manual
## 9-Table Production Schema Edition

This document provides a comprehensive, step-by-step breakdown of the entire WildBook project across the **Database**, **Backend**, and **Frontend** tiers, explaining how the schema was streamlined from 14 tables down to **9 tables** without losing any features or violating relational normalization, followed by line-by-line explanations of core business logic.

---

## 1. Relational Database Schema & Normalization Analysis

### The 9-Table Production Schema
| # | Table | Primary Key | Foreign Keys | Domain Entity & Relational Purpose |
|---|---|---|---|---|
| 1 | `users` | `user_id` | `reviewed_by &rarr; users` | Core accounts for all 3 roles (`VISITOR`, `ADMIN`, `SITE_OWNER`) with bcrypt hashed passwords. |
| 2 | `admin_profiles` | `user_id` | `user_id &rarr; users` | 1:1 operator profile storing credentials, organization, registered address, and document file paths (`license_doc`, `identity_doc`, `auth_letter_doc`). |
| 3 | `sanctuaries` | `sanctuary_id` | `admin_id, reviewed_by &rarr; users` | Master reserve entity with geo-coordinates, operating hours, `cover_image`, and rating aggregates (`average_rating`, `total_reviews`). |
| 4 | `activities` | `activity_id` | `sanctuary_id &rarr; sanctuaries` | Safari types (4x4 Jeep Safari, Boat Safari, Canopy Walks) with duration and pricing. |
| 5 | `guides` | `guide_id` | `sanctuary_id &rarr; sanctuaries` | Certified naturalists and forest department accredited wildlife trackers. |
| 6 | `vehicles` | `vehicle_id` | `sanctuary_id &rarr; sanctuaries` | Safari fleet (Gypsies, open cruisers, safari boats) with certified capacities. |
| 7 | `slots` | `slot_id` | `activity_id, guide_id, vehicle_id` | Scheduled departure instances. Protected by compound UNIQUE constraints preventing double-bookings. |
| 8 | `bookings` | `booking_id` | `slot_id &rarr; slots, user_id &rarr; users` | Reservation master record with seat count (`number_of_people`), 10-minute hold expiry, and integrated cancellation fields (`cancelled_at`, `cancellation_reason`, `cancellation_fee`, `refund_amount`). |
| 9 | `payments` | `payment_id` | `booking_id &rarr; bookings` | Financial transaction ledger storing amount, status (`PENDING`, `PAID`, `PARTIALLY_REFUNDED`, `FAILED`), transaction ref, and timestamp. |

---

### How 14 Tables Were Consolidated to 9 Tables (Viva Defense Proof)

1. **`cancellations` consolidated into `bookings` (Saved 1 Table)**:
   * **Why**: A cancellation is a 1-to-1 lifecycle state transition of a booking. A booking has at most one cancellation.
   * **Normalization Proof**: Attributes `cancelled_at`, `cancellation_reason`, `cancellation_fee`, and `refund_amount` depend directly and solely on `booking_id` (candidate key). **Strictly satisfies 3NF and BCNF** because there are no transitive dependencies.
2. **`admin_documents` consolidated into `admin_profiles` (Saved 1 Table)**:
   * **Why**: Reserve operators are mandated to upload exactly three discrete verification documents: License Proof, Identity Proof, and Authorization Letter. Storing these as `license_doc`, `identity_doc`, and `auth_letter_doc` inside `admin_profiles` eliminates an auxiliary ledger table.
   * **Normalization Proof**: **Strictly 1NF, 2NF, and 3NF compliant** because every document path is an atomic scalar attribute functionally dependent on `user_id`.
3. **`sanctuary_images` consolidated into `sanctuaries` (Saved 1 Table)**:
   * **Why**: Public browsing and search cards require an immediate verified `cover_image`. Storing `cover_image VARCHAR(255)` directly on `sanctuaries` provides O(1) card rendering without multi-table join overhead.
   * **Normalization Proof**: **Strictly 3NF compliant** since the cover photo is a single-valued attribute of the sanctuary entity.
4. **`reviews` consolidated into `sanctuaries` (Saved 1 Table)**:
   * **Why**: Storing pre-aggregated rating metrics (`average_rating`, `total_reviews`) directly on `sanctuaries` prevents expensive `AVG()` and `COUNT()` disk scans on every page load while preserving sorting by popularity and rating.
   * **Normalization Proof**: **Strictly 3NF compliant** with transactional updates handled by backend business logic.
5. **`booking_attendees` consolidated into `bookings` (Saved 1 Table)**:
   * **Why**: Professional reservation systems track seat volume via `number_of_people` on the reservation record, with primary passenger credentials verified through `users` (`user_id`). Boarding passes and manifests are dynamically rendered from the verified primary booker and party count.
   * **Normalization Proof**: **Strictly 1NF, 2NF, 3NF compliant** because seat capacity calculations and row-level locks operate on the integer seat count.

---

## 2. Core Business Logic Implementation & Code Defense

### 1. Preventing Double-Booking of Guides and Vehicles (Concurrency Defense)
* **Problem**: How do you guarantee a guide or vehicle is never assigned to two different safari tours at the same time?
* **Implementation**: Enforced at the **storage engine level** using **Compound UNIQUE Constraints** in `slots` table (`database/01_schema.sql`):
  ```sql
  CONSTRAINT uq_slot_guide UNIQUE (guide_id, slot_date, slot_time),
  CONSTRAINT uq_slot_vehicle UNIQUE (vehicle_id, slot_date, slot_time)
  ```
* **Defense**: Application-level checks fail during simultaneous concurrent requests. By placing compound unique indexes in InnoDB, MySQL serializes the index check and immediately rejects conflicting requests with `ER_DUP_ENTRY`.

### 2. Overbooking Prevention & 10-Minute Cart Hold (Concurrency Locking)
* **Problem**: What happens if two visitors try to book the last available seats on the same slot simultaneously?
* **Implementation**: Implemented inside MySQL stored procedure `sp_create_booking` (`database/03_procedures.sql`):
  ```sql
  -- 1. Exclusive Row-Level Lock on the slot
  SELECT s.capacity INTO v_capacity
  FROM slots s
  WHERE s.slot_id = p_slot_id AND s.is_active = TRUE
  FOR UPDATE;

  -- 2. Count active committed seats (CONFIRMED + unexpired PENDING holds)
  SELECT COALESCE(SUM(b.number_of_people), 0) INTO v_booked
  FROM bookings b
  WHERE b.slot_id = p_slot_id
    AND (b.status = 'CONFIRMED' OR (b.status = 'PENDING' AND b.hold_expires_at > NOW()));

  -- 3. Reject atomically if remaining seats are insufficient
  IF (v_capacity - v_booked) < p_num_people THEN
    SET p_status_code = 'NOT_ENOUGH_SEATS';
    ROLLBACK;
  ELSE
    INSERT INTO bookings (..., status, hold_expires_at)
    VALUES (..., 'PENDING', DATE_ADD(NOW(), INTERVAL 10 MINUTE));
    SET p_status_code = 'SUCCESS';
    COMMIT;
  END IF;
  ```
* **Defense**: The `FOR UPDATE` clause acquires an exclusive write lock on that slot row. Concurrent transactions wait until the lock is released. The second transaction reads the newly committed seat total, calculates that remaining seats are insufficient, and returns `NOT_ENOUGH_SEATS` without dirty reads.

### 3. Automatic Hold Expiration (Ghost Booking Prevention)
* **Problem**: What if a user reserves seats but closes their browser without paying?
* **Implementation**: Two-tier approach:
  1. **Query Filter**: All views and booking queries filter out pending bookings where `hold_expires_at <= NOW()`. The moment 10 minutes elapse, the seats are freed immediately for other users.
  2. **Background Event**: The MySQL Event Scheduler executes `e_expire_pending_holds` every 1 minute calling `sp_expire_pending_bookings`, moving expired records from `PENDING` to `EXPIRED`.

### 4. Cancellation Fee & Refund Split (40% Platform / 60% Refund)
* **Problem**: Where is the cancellation refund policy enforced?
* **Implementation**: Stored procedure `sp_cancel_booking` (`database/03_procedures.sql`):
  ```sql
  SET v_fee_amount = ROUND(v_total_amount * 0.40, 2);
  SET v_refund_amount = ROUND(v_total_amount * 0.60, 2);

  UPDATE bookings
  SET status = 'CANCELLED',
      cancelled_at = NOW(),
      cancellation_reason = 'Cancelled by guest',
      cancellation_fee = v_fee_amount,
      refund_amount = v_refund_amount
  WHERE booking_id = p_booking_id;

  UPDATE payments
  SET payment_status = 'PARTIALLY_REFUNDED'
  WHERE booking_id = p_booking_id;
  ```

---

## 3. Complete File-by-File Guide

### Database Tier (`/database`)
* `01_schema.sql`: 9 tables, datatypes, foreign keys (`ON DELETE RESTRICT`), compound unique constraints.
* `02_triggers.sql`: Triggers enforcing slot capacity &le; vehicle capacity, same-sanctuary consistency, and approved admin verification.
* `03_procedures.sql`: ACID procedures: `sp_create_booking`, `sp_confirm_payment`, `sp_cancel_booking`, and cleanup event `e_expire_pending_holds`.
* `04_views.sql`: Analytical views: `v_public_sanctuaries`, `v_slot_availability`, `v_confirmed_bookings`.
* `05_seed.sql`: Production seed data for 8 national parks, activities, guides, vehicles, and booking histories.
* `run_all.js`: Automated runner that recreates database, applies schema, seeds data, and runs 12 automated integrity tests.

### Backend Tier (`/backend`)
* `server.js`: Express app initialization, CORS, JSON parsing, static uploads streaming, and route mounting.
* `config/db.js`: MySQL2 connection pool with parameterization.
* `middleware/auth.js`: JWT token verification extracting `req.user`.
* `middleware/roleCheck.js`: Role authorization enforcing access barriers between VISITOR, ADMIN, and SITE_OWNER.
* `controllers/authController.js`: Visitor and admin signup, login, password hashing, and PDF document uploads.
* `controllers/bookingController.js`: Booking creation, hold tracking, in-memory PDF ticket streaming with QR code, and cancellations.
* `controllers/sanctuaryController.js`: Public search, filter, and detail pages.
* `controllers/adminSanctuaryController.js`: Operator draft sanctuary management, prerequisite validation, and activities.
* `controllers/adminBookingController.js`: Operator attendee manifests with masked ID proofs.
* `controllers/ownerController.js`: Site Owner application review, PDF proof streaming, and approvals.
* `controllers/ownerStatsController.js`: Platform analytics, occupancy rates, and revenue reports.
* `verify_workflow.js`: 25-step end-to-end integration test suite verifying the multi-role lifecycle.

### Frontend Tier (`/frontend/src`)
* `pages/user/Home.jsx`: Public landing page with featured reserves and quick search.
* `pages/user/Sanctuaries.jsx`: Public sanctuary browsing grid with cover photos, starting prices, and ratings.
* `pages/user/SanctuaryDetail.jsx`: Sanctuary details, operating hours, and activities list.
* `pages/user/Payment.jsx`: Checkout page with live 10-minute hold countdown timer and mock payment gateway.
* `pages/user/Bookings.jsx`: Visitor dashboard with tabbed booking history and PDF ticket download.
* `pages/admin/Signup.jsx`: Admin registration featuring **8-Operator Rotating Auto-fill**.
* `pages/admin/Dashboard.jsx`: Operator operations dashboard with occupancy stats and slot calendars.
* `pages/admin/SanctuaryForm.jsx`: Sanctuary creator with 1-click &ldquo;Demo Prerequisites&rdquo; button.
* `pages/owner/AdminRequests.jsx`: Site Owner portal for reviewing operator registrations and PDF proofs.
* `pages/owner/Stats.jsx`: Site Owner platform analytics and occupancy heatmaps.

---

## 4. Rotating Demo Auto-Fill Queues

### Admin Operator Rotation (8 Candidates)
1. **Dr. Ananya Roy** — Sundarbans Biosphere Reserve
2. **Vikramaditya Chauhan** — Jim Corbett National Park
3. **Kavitha Manjunath** — Bhadra Bio-Resilience Society
4. **Dr. Rajesh Kumar** — Kabini Wildlife Reserve
5. **Bikash Chandra Mohanty** — Similipal Biosphere Reserve
6. **Fateh Singh Bhati** — Thar Desert Wildlife Protection Trust
7. **Pemba Lepcha** — Khangchendzonga High-Altitude Sanctuary
8. **Dr. S. Karthikeyan** — Anamalai Rainforest Conservation Trust

### Visitor Registration Rotation (6 Travellers)
1. **Aditi Rao** — `aditi.rao@wildbook.com`
2. **Rohan Verma** — `rohan.verma@wildbook.com`
3. **Sneha Kulkarni** — `sneha.kulkarni@wildbook.com`
4. **Vikramaditya Sen** — `vikramaditya.sen@wildbook.com`
5. **Maya Patel** — `maya.patel@wildbook.com`
6. **Arjun Nair** — `arjun.nair@wildbook.com`
