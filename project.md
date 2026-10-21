# WildBook: Development Plan

Wildlife sanctuary and safari reservation system | MySQL (InnoDB) + Node.js/Express + React

This file replaces the earlier `project.md`. It is the master plan. The copy-paste prompts and the list of files to give the AI at each phase are in `antigravity-prompts.md`. Page images and visual rules are in `design/` (`design-spec.md`, images 01 to 25).

---

## 1. What we are building

Three portals, each with its own login, logo and colour palette:

| Portal | Who | Core power |
|---|---|---|
| **Visitor site** | Public users | Browse, book, pay, get a booking ID, cancel (lose 40%), review |
| **Admin portal** | Sanctuary operators | Add sanctuary details, images, activities, slots, prices. See their own bookings |
| **Site Owner portal** | Government authority | Approve admin accounts, approve sanctuaries before they are listed |

### Rules that never change

1. An admin cannot add anything until the Site Owner approves their **account**.
2. A sanctuary is **not public** until the Site Owner approves that **submission**.
3. A booking never exceeds slot capacity. Check and insert happen in one transaction with `SELECT ... FOR UPDATE`.
4. Payment success gives a booking ID (`WB-000101` format).
5. Cancelling keeps **40%** as a fee and refunds **60%**.
6. Only a visitor with a past confirmed booking can review, once per booking.
7. Money and booking history are never deleted. Status changes instead.
8. Every protected route checks **role and ownership on the server**.

---

## 2. Final database (summary)

From your 3NF report, plus the additions for three portals. The exact SQL is written in Phase 1.

| Table | Key columns |
|---|---|
| `users` | user_id, name, email UNIQUE, phone, password_hash, role (VISITOR, ADMIN, SITE_OWNER), account_status (PENDING, APPROVED, REJECTED, SUSPENDED), reviewed_by, reviewed_at, review_note, profile_image, created_at |
| `admin_profiles` | user_id PK/FK, organisation_name, license_number UNIQUE, designation, registered_address, website |
| `admin_documents` | document_id, admin_id FK, doc_type (LICENSE, IDENTITY, AUTHORIZATION), file_path, uploaded_at |
| `sanctuaries` | sanctuary_id, admin_id FK, name, location, description, contact_email, contact_phone, website, opening_time, closing_time, operating_days, best_time_to_visit, latitude, longitude, listing_status (DRAFT, PENDING, APPROVED, REJECTED), review_note, reviewed_by, reviewed_at |
| `sanctuary_images` | image_id, sanctuary_id FK, image_path, is_cover, sort_order, uploaded_at |
| `activities` | activity_id, sanctuary_id FK, activity_name, description, duration_minutes, what_to_carry, price, is_active |
| `guides` | guide_id, sanctuary_id FK, name, phone, experience |
| `vehicles` | vehicle_id, sanctuary_id FK, vehicle_type, capacity |
| `slots` | slot_id, activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active. UNIQUE(guide, date, time), UNIQUE(vehicle, date, time) |
| `bookings` | booking_id, booking_code UNIQUE, user_id, slot_id, number_of_people, status (PENDING, CONFIRMED, CANCELLED, EXPIRED), total_amount, hold_expires_at, booked_at |
| `booking_attendees` | attendee_id, booking_id FK (cascade), name, age, id_type, id_number |
| `payments` | payment_id, booking_id UNIQUE, amount, payment_status (PENDING, PAID, FAILED, PARTIALLY_REFUNDED), transaction_ref, paid_at |
| `cancellations` | cancellation_id, booking_id UNIQUE, cancelled_at, amount_paid, fee_percent, fee_amount, refund_amount |
| `reviews` | review_id, booking_id UNIQUE, user_id, sanctuary_id, rating 1 to 5, comment, created_at |

Seats taken in a slot = sum of `number_of_people` for bookings that are CONFIRMED, plus PENDING ones whose `hold_expires_at` is still in the future.

Decisions I made for you (change them if you disagree):
- Review photos (shown in design 12) are **dropped** from version 1. Add a `review_images` table later if you want them.
- Guides and vehicles belong to one sanctuary, so each admin only sees their own.
- Payment is a **mock** page. A real gateway can replace it later.

---

## 3. Repository layout

```
wildbook/
├── project.md
├── antigravity-prompts.md
├── PROGRESS.md                 (you update this after every phase)
├── design/                     (images 01 to 25, design-spec.md)
├── database/                   (01_schema.sql, 02_triggers.sql, 03_procedures.sql, 04_views.sql, 05_seed.sql, tests.sql)
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/             (auth.js, role.js, ownership.js, upload.js, errorHandler.js)
│   ├── routes/ controllers/ services/
│   ├── jobs/                   (expireHolds.js)
│   └── uploads/                (sanctuaries/, admin-docs/)
└── frontend/
    └── src/
        ├── assets/logos/       (logo-user, logo-admin, logo-owner)
        ├── theme/              (theme-user.css, theme-admin.css, theme-owner.css)
        ├── components/         (Logo, Navbar, Footer, Sidebar, Card, Button, Modal, StatusBadge, Stepper, Table)
        ├── context/AuthContext.jsx
        ├── api/client.js
        └── pages/ (user/, admin/, owner/, NotFound.jsx)
```

---

## 4. How to work (the loop for every phase)

1. Open `antigravity-prompts.md`, find the phase, and attach the files it lists.
2. Paste the phase prompt. Let the AI build **only that phase**.
3. Run the backend and frontend. Test with Postman first, then in the browser.
4. Check the "Done when" list for that phase. Fix problems in the same chat.
5. Commit to Git: `git commit -m "Phase N: ..."`.
6. Update `PROGRESS.md` (what works, what is stubbed, known bugs).
7. Start a **new chat** for the next phase and attach `PROGRESS.md` so the AI knows the current state.

Each phase builds both sides of its pages (database, backend, frontend), so you can demo it when it is finished.

---

## 5. Phases

### Phase 0: Foundation (shared pieces, no real pages yet)

**What it does:** sets up everything every page will reuse so all three portals look consistent.

- **Backend:** Express server, `.env` loading, MySQL connection pool, CORS, JSON body parsing, central error handler, `GET /api/health`, static `/uploads` (public images only).
- **Frontend:** Vite + React + React Router + Tailwind. Three CSS variable themes (`theme-user`, `theme-admin`, `theme-owner`) switched by one class on the root. Shared components: `Logo` (takes `portal` prop), `Navbar`, `Footer`, admin and owner `Sidebar`, `Card`, `Button`, `Modal`, `StatusBadge`, `Stepper`, `Table`. `AuthContext` and a `ProtectedRoute` that checks role. An API client that adds the token.
- **Rules to follow:** `design-spec.md` sections Portal identity and Shared rules.

**Done when:** the health route queries MySQL, the three themes switch correctly on test pages, and each portal shows only its own logo.

---

### Phase 1: Database layer

**What it does:** creates the real schema and the database logic so later phases only call it.

- `01_schema.sql`: all tables above, with constraints (UNIQUE, CHECK, ENUM, foreign keys; CASCADE only on attendees and images).
- `02_triggers.sql`: slot capacity must not exceed vehicle capacity; vehicle and activity must belong to the same sanctuary; slots can only be added by an APPROVED admin; a review requires a past confirmed booking of the same user.
- `03_procedures.sql`: `sp_create_booking`, `sp_confirm_payment`, `sp_cancel_booking`, and an event or job that marks expired PENDING bookings as EXPIRED. Booking logic:

```sql
START TRANSACTION;
SELECT s.capacity, a.price INTO v_capacity, v_price
  FROM slots s JOIN activities a ON a.activity_id = s.activity_id
  WHERE s.slot_id = p_slot_id FOR UPDATE;          -- locks the slot row
SELECT COALESCE(SUM(number_of_people),0) INTO v_taken FROM bookings
  WHERE slot_id = p_slot_id
    AND (status='CONFIRMED' OR (status='PENDING' AND hold_expires_at > NOW()));
IF v_taken + p_people > v_capacity THEN ROLLBACK; -- NOT_ENOUGH_SEATS
ELSE INSERT booking (PENDING, hold 10 minutes) + payment (PENDING); COMMIT; END IF;
```

  Cancellation: lock the booking, require CONFIRMED and a future slot, set CANCELLED, insert a `cancellations` row (fee 40%, refund 60%), set payment to PARTIALLY_REFUNDED.
- `04_views.sql`: `v_public_sanctuaries` (APPROVED only, with cover image and average rating), `v_slot_availability` (seats left), `v_confirmed_bookings`.
- Indexes: users(email), slots(slot_date), activities(sanctuary_id), bookings(status), bookings(slot_id, status), sanctuaries(listing_status).
- `05_seed.sql`: one SITE_OWNER (no public signup), one approved admin, one pending admin, one visitor, two sanctuaries with activities and slots. Passwords are bcrypt hashes made with a small Node script.
- `tests.sql`: queries that prove the rules (duplicate email fails, double guide allocation fails, overbooking is rejected, concurrent booking gives one success).

**Done when:** schema runs from scratch, all `tests.sql` checks behave as expected.

---

### Phase 2: Authentication, all three portals

**Pages:** 02 visitor login, 03 visitor signup, 13 admin login, 14 admin signup, 15 admin pending, 21 owner login.

**What it does:** lets each role sign in to its own portal and blocks everyone else.

- **Backend** (`/api/auth/...`):
  - `POST /user/signup`: creates a VISITOR with status APPROVED.
  - `POST /user/login`, `POST /admin/login`, `POST /owner/login`: each rejects the wrong role. Admin login also rejects PENDING, REJECTED and SUSPENDED with a specific message.
  - `POST /admin/signup`: creates an ADMIN with status PENDING, saves the `admin_profiles` row and three uploaded documents (license, identity, authorization) into `uploads/admin-docs/` (private, not served as static files).
  - `GET /me`: returns the current user from the token.
  - Middleware: `authRequired`, `requireRole(...)`, `requireApprovedAdmin`. Passwords hashed with bcrypt, JWT with a 2-hour expiry, login rate limit.
- **Frontend:** the six pages with validation (email format, password strength bar on admin signup, confirm password, terms checkbox), clear error messages, show/hide password, redirect to the right home after login (`/`, `/admin`, `/owner`). Admin signup shows file inputs for the three documents plus designation, address and website.
- **Pending page (15):** shows the status stepper and Log out only. A PENDING admin who logs in lands here and cannot reach other admin pages.

**Done when:** a visitor token gets 403 on admin routes, a pending admin cannot reach `/admin`, and the owner has no signup page.

---

### Phase 3: Site Owner approves admins

**Page:** 23 admin requests (plus the owner shell and sidebar).

**What it does:** the authority reviews each new sanctuary operator and decides whether they may use the platform.

- **Backend:** `GET /api/owner/admins?status=&search=&page=&sort=` (with tab counts), `GET /api/owner/admins/:id` (profile and document list), `GET /api/owner/admins/:id/documents/:docId` (streams the file, owner only), `PATCH /api/owner/admins/:id` with `{ decision: APPROVED | REJECTED | SUSPENDED, note }`. Reject requires a note. Each decision stores `reviewed_by`, `reviewed_at`, `review_note`.
- **Frontend:** owner layout (sidebar with the five fixed items), tabs with counts, search, sortable table, pagination, right detail panel with personal info, organisation info, document downloads, notes box, and the Approve, Reject, Suspend buttons.

**Done when:** approving a pending admin lets that admin log in; rejecting or suspending blocks them with the note shown at login.

---

### Phase 4: Admin sanctuaries (draft and images)

**Pages:** 17 my sanctuaries, 18 add or edit sanctuary.

**What it does:** the admin creates a sanctuary page with details and photos, and keeps it as a draft.

- **Backend** (`requireRole('ADMIN')`, `requireApprovedAdmin`, ownership check on every row):
  - `POST/GET/PUT /api/admin/sanctuaries`, `GET /api/admin/sanctuaries/:id`.
  - `POST /api/admin/sanctuaries/:id/images` (multer: jpg, png, webp, 2 MB each, renamed files, max 10), `PATCH .../images/:imageId` (set cover, reorder), `DELETE .../images/:imageId` (removes the DB row and the file).
  - Editing is blocked while `listing_status` is PENDING.
- **Frontend:** admin layout (sidebar with the six fixed items), cards with status chips (Draft, Pending, Approved, Rejected), rejected card shows the reviewer note and "Edit and resubmit", add/edit form with sections (basic info, image upload with drag and drop, cover star, reorder, contact, hours and days). "Save draft" works now. "Submit for approval" is shown but disabled until Phase 6.

**Done when:** an admin creates a draft with images, edits it, sets a cover, deletes an image (file removed from disk), and cannot see another admin's sanctuary.

---

### Phase 5: Admin activities, guides, vehicles and slots

**Page:** 19 activities and slots.

**What it does:** the admin defines what visitors can book and when.

- **Backend:** CRUD for `/api/admin/activities`, `/guides`, `/vehicles`, `/slots`, all scoped to the admin's own sanctuary. `GET /api/admin/slots?sanctuary_id=&week=` returns a week with seats booked per slot. Database triggers reject a slot whose capacity exceeds the vehicle, or a guide or vehicle double-booked at the same date and time. The API converts those errors into friendly messages. A slot with confirmed bookings cannot change date, time or capacity (only deactivate). Activities and slots are deactivated (`is_active`), never deleted, once bookings exist.
- **Frontend:** activity list with add, edit, delete icons and a price per person; weekly calendar grid with coloured slot blocks showing time, guide, vehicle and seats (for example 6/6); week navigation and "Today"; right-hand "Add slot" panel (activity, guide, vehicle, date, time, capacity). Guides and vehicles get simple add/edit dialogs from the same page (and the sidebar item Guides & Vehicles).

**Done when:** an admin builds a full set of activities and slots, and the double-allocation and capacity errors show as readable messages.

---

### Phase 6: Submit for approval and Site Owner reviews sanctuaries

**Pages:** 24 sanctuary review, plus Approved Sanctuaries list (no image, reuse table style of 23).

**What it does:** closes the loop so a sanctuary can go live.

- **Backend:** `POST /api/admin/sanctuaries/:id/submit` (needs at least one image, one activity and one slot; sets PENDING). Owner: `GET /api/owner/sanctuaries?status=`, `GET /api/owner/sanctuaries/:id` (details, gallery, activities with prices, slot summary per activity), `PATCH /api/owner/sanctuaries/:id` with `{ decision: APPROVED | REJECTED, note }` (reject needs a note), `GET /api/owner/sanctuaries?status=APPROVED`.
- **Frontend:** enable "Submit for approval" on page 18 (and the resubmit action on page 17). Owner page 24: submission preview, gallery, activities and slots summary, three checklist checkboxes (Approve enabled only when all are ticked), note box, "Approve and list" and "Reject with note". Approved Sanctuaries list page.

**Done when (first full checkpoint):** admin submits, owner approves, sanctuary appears in `v_public_sanctuaries`. Reject, edit and resubmit also works, with the note shown to the admin.

---

### Phase 7: Visitor browsing

**Pages:** 01 home, 04 browse sanctuaries, 05 sanctuary detail, 06 activity and slot selection.

**What it does:** lets visitors discover approved sanctuaries and choose a slot, with no login needed until they book.

- **Backend (public):** `GET /api/sanctuaries?search=&location=&activity=&rating=&page=`, `GET /api/sanctuaries/featured`, `GET /api/sanctuaries/:id` (gallery, activities, hours, best time, coordinates, average rating), `GET /api/activities/:id/slots?date=` (from `v_slot_availability`; hides past slots). Only APPROVED sanctuaries are returned; others give 404.
- **Frontend:**
  - Home (01): scrolling page with the hero **carousel that slides left** (auto every 5 s, pause on hover, dots), a fixed search bar, featured sanctuaries, ways to explore, steps, testimonials.
  - Browse (04): search, filters, cards, pagination.
  - Detail (05): gallery, about, activity cards with "View slots", info card with an "Open in Google Maps" link built from coordinates, opening hours, "Book an experience". The reviews block is empty until Phase 10.
  - Slots (06): calendar, slot chips with seats left (sold out disabled), people counter, live total. "Continue to booking" sends a logged-out user to login and back.

**Done when:** a visitor goes from home to slot selection with accurate seats-left numbers, and an unapproved sanctuary cannot be opened by URL.

---

### Phase 8: Booking and payment

**Pages:** 07 booking details, 08 payment, 09 booking confirmed.

**What it does:** the core of the project. It reserves seats safely, takes payment, and issues the booking ID.

- **Backend:**
  - `POST /api/bookings` with `{ slot_id, attendees: [...] }`: validates attendee count, runs `sp_create_booking` (locks the slot, checks capacity, creates a PENDING booking with a 10-minute hold, its attendees, and a PENDING payment), returns the booking.
  - `GET /api/bookings/:id` (owner only) with the remaining hold time.
  - `POST /api/payments/:bookingId/pay` (mock: body says success or failure): on success `sp_confirm_payment` sets payment PAID and booking CONFIRMED and returns `booking_code`; on failure the payment is FAILED and the booking stays PENDING until the hold ends.
  - `GET /api/bookings/:id/ticket` generates a PDF with a QR code on request (CONFIRMED and owned by the caller only). Tickets are not stored.
  - `jobs/expireHolds.js` (every minute): PENDING bookings past `hold_expires_at` become EXPIRED.
- **Frontend:** booking details (07): one attendee card per person (name, age, ID type, ID number), "Add another attendee", summary card with the 40% warning, "Proceed to payment". Payment (08): UPI, card and net banking tabs (mock), countdown from the server's hold time, "Pay" button, failure state with retry. Confirmed (09): booking ID in the ticket box, details, "Download ticket", "View my bookings".

**Done when:** two simultaneous requests for the last seats give exactly one success; paying after the hold expires is rejected; attendee count mismatch rolls everything back.

---

### Phase 9: My bookings and cancellation

**Pages:** 10 my bookings, 11 cancel booking modal.

**What it does:** the visitor tracks their bookings and cancels with the 40% fee.

- **Backend:** `GET /api/bookings/mine?tab=upcoming|past|cancelled`, `GET /api/bookings/:id/cancel-preview` (amount paid, fee, refund), `POST /api/bookings/:id/cancel` (runs `sp_cancel_booking`). The fee is always computed on the server. Cancellation is allowed only for CONFIRMED bookings whose slot has not started.
- **Frontend:** tabs Upcoming, Past, Cancelled; booking cards with status badge. Buttons depend on state: Upcoming gets View ticket and Cancel; Past gets View ticket and Write a review; Cancelled gets View ticket only. The modal shows amount paid, 40% fee in red, 60% refund in green, then Keep booking or Confirm cancellation.

**Done when:** after cancelling, seats-left increases, the booking shows Cancelled, and the cancellation row holds the right fee and refund.

---

### Phase 10: Reviews

**Page:** 12 write a review (and the reviews block on page 05).

**What it does:** visitors rate sanctuaries they actually visited.

- **Backend:** `POST /api/reviews` (booking must be CONFIRMED, owned by the caller, slot in the past, no existing review), `GET /api/sanctuaries/:id/reviews?page=`, average rating and rating counts included in the sanctuary detail response.
- **Frontend:** star rating, comment with counter, submit. Sanctuary detail shows the average, the 5-to-1 bars and review cards. The Write a review button on My Bookings opens this page.

**Done when:** a visitor without a past booking is rejected, a second review for the same booking is rejected, and the average on the sanctuary card updates.

---

### Phase 11: Admin bookings, dashboards and reports

**Pages:** 20 admin bookings, 16 admin dashboard, 22 owner dashboard (plus Reports pages for both).

**What it does:** gives admins and the authority the numbers, built on all earlier data.

- **Backend:**
  - Admin: `GET /api/admin/bookings?from=&to=&activity=&status=&page=` (own sanctuary only), `GET /api/admin/bookings/:id` (attendees, ID shown as last 4 characters only), `GET /api/admin/bookings/export` (CSV), `GET /api/admin/stats` (totals, revenue net of refunds, upcoming slots, average rating, bookings per day, revenue per activity, recent bookings).
  - Owner: `GET /api/owner/stats` (pending admins, pending sanctuaries, approved sanctuaries, total bookings, bookings per sanctuary, approvals over time, latest pending requests).
  - Reports (SQL, used in your viva): most-booked sanctuaries, frequent bookers, revenue per sanctuary per month including cancellation fees kept, slot occupancy, cancellation rate. Include one subquery and one `GROUP BY ... HAVING`.
- **Frontend:** admin bookings table with filters, pagination, detail drawer and Export; admin dashboard with stat cards, line chart, bar chart (Chart.js) and recent bookings; owner dashboard with stat cards, two charts and the "Needs your attention" table linking to the review pages; a Reports page for each portal.

**Done when:** every number on the dashboards matches a direct SQL query on the same data.

---

### Phase 12: Polish, security, testing, documents

**Page:** 25 404 (route `*`), plus all pages.

- 404 page using the shared navbar and footer.
- Loading, empty and error states on every page; friendly messages for sold out, payment failed, pending approval.
- Responsive layouts, at least for the visitor site.
- Validation on both sides (`zod` or `express-validator`).
- Security check: bcrypt, parameterised queries only, role and ownership on every route, upload allow-list, admin documents served only to the owner, never return `password_hash`, login rate limit, `.env` ignored by Git.
- Tests: the 13-item checklist from your implementation plan plus the table below. Save results with screenshots in `docs/test-results.md`.
- Update the ER diagram, relational schema diagram and normalization report for the new tables.
- `README.md` with setup steps and seed logins; prepare the demo.

---

## 6. Extra test cases (add to your original 13)

| # | Test | Expected |
|---|---|---|
| T1 | Pending admin logs in | Blocked with a clear message |
| T2 | Visitor token on an admin or owner route | 403 |
| T3 | Admin edits another admin's sanctuary | 403 or 404 |
| T4 | Unapproved sanctuary opened by URL | 404 |
| T5 | Submit with no image, activity or slot | Rejected |
| T6 | Owner approves a sanctuary | It appears in the public list |
| T7 | Booking above remaining capacity | Rejected, nothing inserted |
| T8 | Two concurrent bookings for the last seats | Exactly one succeeds |
| T9 | Payment after the hold expires | Rejected, booking EXPIRED |
| T10 | Cancel a confirmed booking | 40% fee, 60% refund, seats freed |
| T11 | Cancel an already cancelled booking | Rejected |
| T12 | Review without a past booking, or twice | Rejected |
| T13 | Duplicate email | Rejected |
| T14 | Guide double-allocated at the same time | Rejected |
| T15 | Attendee count differs from number of people | Whole booking rolls back |
| T16 | Admin document URL opened by a visitor | 403 |

## 7. Demo script (viva)

1. Admin signs up with documents and sees the pending screen.
2. Owner approves the admin.
3. Admin builds a sanctuary (images, activities, slots) and submits it.
4. Owner reviews and approves. It goes live.
5. Visitor browses, picks a slot, books, pays, gets the booking ID and ticket.
6. Show the overbooking block.
7. Visitor cancels: 40% fee, 60% refund.
8. Visitor reviews after a past slot (seeded data).
9. Show dashboards and reports, then the SQL: transaction with `FOR UPDATE`, triggers, views.

## 8. Definition of done

- [ ] All three portals work end to end with their own login, logo and palette
- [ ] Owner approval gates both admin accounts and sanctuary listing
- [ ] Booking is transaction-safe and cannot overbook
- [ ] Payment produces a booking ID and a ticket
- [ ] Cancellation applies the 40% fee and frees seats
- [ ] Reviews only for past confirmed bookings
- [ ] Views, indexes, triggers and procedures are in `database/`
- [ ] Dashboards and reports match direct SQL
- [ ] Original 13 tests and T1 to T16 pass and are documented
- [ ] ER diagram, schema diagram and normalization report are updated

## 9. Out of scope (future work)

Real payment gateway, email or SMS notifications, gateway refunds, wait-lists, review photos, mobile app.
