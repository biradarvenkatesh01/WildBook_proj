# WildBook — Official Test Results Report (T1 to T16)

**Test Execution Date:** 2026-10-22  
**Platform:** WildBook Wildlife Sanctuary & Safari Reservation System  
**Test Suite:** `backend/test_t1_t16.js`  
**Result:** **16/16 Passed (100% Success Rate)**  

---

## Executive Summary

All 16 mission-critical system integrity, access-control, concurrency, and financial safety assertions specified in `project.md` Section 6 were executed against live MySQL and Express instances. Every test passed cleanly.

```
====================================================
WildBook Verification Test Suite: T1 to T16
====================================================

[✅ PASS] T1: Pending admin login blocked
[✅ PASS] T2: Visitor token on admin/owner route
[✅ PASS] T3: Admin edits another admin sanctuary
[✅ PASS] T4: Unapproved sanctuary opened by public URL
[✅ PASS] T5: Submit with no image, activity or slot
[✅ PASS] T6: Owner approved sanctuary appears in public list
[✅ PASS] T7: Booking above remaining capacity
[✅ PASS] T8: Concurrent bookings for last seats (Atomic Lock)
[✅ PASS] T9: Payment after hold expires
[✅ PASS] T10: Cancel confirmed booking (40% fee, 60% refund)
[✅ PASS] T11: Cancel already cancelled booking
[✅ PASS] T12: Review without completed past booking
[✅ PASS] T13: Duplicate email registration
[✅ PASS] T14: Guide double-allocated at same date & time
[✅ PASS] T15: Attendee count mismatch rolls back transaction
[✅ PASS] T16: Admin document URL opened by a visitor

====================================================
Final Result: 16/16 Tests Passed!
====================================================
```

---

## Detailed Test Case Breakdown

| # | Test Scenario | Expected Outcome | Actual Response | Status |
|---|---|---|---|:---:|
| **T1** | Pending admin logs in | Blocked with clear message (`403 Forbidden`) | Status `403`: "Account pending authority approval" | ✅ PASS |
| **T2** | Visitor token on an admin or owner route | Blocked with `403 Forbidden` | Status `403`: Role authorization check failed | ✅ PASS |
| **T3** | Admin edits another admin's sanctuary | Blocked (`403 Forbidden` or `404`) | Status `403`: "Access denied. You do not own this sanctuary listing." | ✅ PASS |
| **T4** | Unapproved sanctuary opened by public URL | Blocked (`404 Not Found`) | Status `404`: Public view strictly checks `listing_status = 'APPROVED'` | ✅ PASS |
| **T5** | Submit sanctuary with no image, activity or slot | Validation rejection (`400 Bad Request`) | Status `400`: "Cannot submit without cover image, activities, and slots" | ✅ PASS |
| **T6** | Owner approves a sanctuary | Appears immediately in public catalog | Status `200`: Sanctuary appears in `GET /api/sanctuaries` | ✅ PASS |
| **T7** | Booking above remaining capacity | Transaction rejected (`400 Bad Request`) | Status `400`: `sp_create_booking` returns `NOT_ENOUGH_SEATS` | ✅ PASS |
| **T8** | Two concurrent bookings for the last remaining seats | Exactly one succeeds, second fails (`SELECT FOR UPDATE`) | 1 succeeded (`201 Created`), 1 rejected (`400 Bad Request`) | ✅ PASS |
| **T9** | Payment attempted after 10-minute hold expires | Payment rejected, booking marked `EXPIRED` | Status `400`: "Hold has expired. Slot released." | ✅ PASS |
| **T10** | Cancel confirmed booking | 40% retention fee kept, 60% refunded, seats freed | Booking cancelled: Fee ₹800 (40%), Refund ₹1200 (60%) | ✅ PASS |
| **T11** | Cancel an already cancelled booking | Duplicate cancellation rejected (`400 Bad Request`) | Status `400`: "Booking is already cancelled" | ✅ PASS |
| **T12** | Review without completed past booking or review twice | Rejected (`400 Bad Request`) | Status `400`: Unverified or duplicate review attempt blocked | ✅ PASS |
| **T13** | Duplicate email registration | Rejection on database uniqueness constraint | Status `409 Conflict`: "An account with this email already exists." | ✅ PASS |
| **T14** | Guide double-allocated at same date & time | Rejected by MySQL trigger and UNIQUE index | Database exception `ER_DUP_ENTRY` caught on `uq_slot_guide` | ✅ PASS |
| **T15** | Attendee count differs from number of people | Transaction validation rolls back insert | Status `400`: "Attendee count does not match specified number of people" | ✅ PASS |
| **T16** | Admin verification document opened by a visitor | Access denied (`403 Forbidden`) | Status `403`: Requires authenticated `SITE_OWNER` role | ✅ PASS |

---

## Security Audit Checklist (Phase 12)

- **Bcrypt Password Hashing:** Verified; all passwords stored as bcrypt hashes with salt rounds = 10 (`$2b$10$...`).
- **No Password Hash Leaks:** Verified; `password_hash` is never included in API responses or public views.
- **Strict Parameterized Queries:** All database queries utilize prepared statements (`?` parameters) across all controllers.
- **Server-Side Role & Ownership:** Every protected route asserts `authRequired`, `requireRole(...)`, and ownership (`admin_id = req.user.user_id` or `b.user_id = req.user.user_id`).
- **Private Document Serving:** Verification documents in `backend/uploads/admin-docs/` are strictly non-static and served only to `SITE_OWNER` via `/api/owner/admins/:id/documents/:docId`.
- **Sanctuary Image Upload Allow-List:** File type checking restricts uploads to JPEG, PNG, and WebP with size caps.
- **Login Rate Limiter:** Express rate limiter active on all `/api/auth/*login` routes (30 requests per 15 minutes).
- **Environment Safety:** Root `.gitignore` and `backend/.gitignore` strictly ignore `.env` and `uploads/admin-docs/*`.
- **Portal Identity:** The `<Logo />` component is the single authority for logo rendering across all three portals.
