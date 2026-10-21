# WildBook: What to give the AI at each phase

Companion to `project.md`. For every phase this file says **what to attach** and gives a **prompt to paste**.

Antigravity works inside your repo, so it can read files itself. "Attach" means: have the file in the repo and @mention it in the prompt. Images should sit in `design/` and be named by number in the prompt. If you use a chat model instead, attach the same files to the message.

---

## 1. Rules for sending files

1. **Always give these three:** `project.md`, `design/design-spec.md`, `PROGRESS.md` (from Phase 1 on).
2. **Send only the page images for the current phase** (the phase lists them). Do not send all 25 images at once: the AI gets less accurate with many images.
3. **One phase per chat.** Start a fresh chat for each phase and begin with the three always-files. This keeps the AI from mixing up phases.
4. **Tell it what not to touch.** Every prompt below says "only this phase". Keep that line.
5. **Run before you move on.** Test each phase with Postman and the browser, tick the "Done when" list in `project.md`, commit, update `PROGRESS.md`.
6. **Logos:** put `logo-user`, `logo-admin`, `logo-owner` in `frontend/src/assets/logos/` before Phase 0. The AI must not redraw logos from the images.

## 2. `PROGRESS.md` template (create it after Phase 0)

```
# Progress

## Done
- Phase 0: foundation (what exists: ...)

## Works now
- (list of routes and pages that work)

## Stubbed or unfinished
- (anything fake or disabled, for example: Submit button disabled until Phase 6)

## Known bugs
- (list)

## Decisions made
- (anything you changed from project.md, for example: review photos dropped)

## Run it
- Backend: cd backend && npm run dev
- Frontend: cd frontend && npm run dev
- Seed logins: owner@..., admin@..., visitor@... (passwords in seed file)
```

## 3. Standard opening for every prompt

Paste this at the top of each phase prompt, then the phase-specific part.

```
You are building the WildBook project (React + Node/Express + MySQL). Read project.md, design/design-spec.md and PROGRESS.md first.
Rules:
- Build ONLY the phase named below. Do not start later phases or rewrite earlier ones, except for small fixes needed to connect.
- Follow design-spec.md "Portal identity": one logo and one palette per portal, via the theme classes and the Logo component. Ignore logos and off-palette colours inside the images.
- Match the page images listed below as a visual reference, but use the shared Navbar, Footer and Sidebar components, not the variations in the images.
- Backend: parameterised queries only, check role AND ownership on every protected route, never return password_hash.
- Before writing code, list in 5 bullets what you will build and which files you will create or change. Then build.
- When done: list the files changed, how to run and test it (with example Postman requests), and anything left unfinished. Update PROGRESS.md.
```

---

## Phase 0: Foundation

**Attach:** `project.md`, `design/design-spec.md`, images `01`, `16`, `22` (only for the navbar, sidebar and colour feel), the three logo files.

```
[Standard opening]
Phase 0: Foundation. Create the repo layout from project.md section 3.
Backend: Express server, dotenv, mysql2 connection pool in config/db.js, CORS, JSON parsing, central errorHandler, GET /api/health that runs SELECT 1, static serving of /uploads/sanctuaries only (not admin-docs).
Frontend: Vite + React + React Router + Tailwind. Create theme-user.css, theme-admin.css, theme-owner.css as CSS variable sets (page background, nav colour, accent, primary button, card radius, heading font) using the exact values in design-spec.md Portal identity, switched by one class on the root element.
Build shared components: Logo (prop portal = user | admin | owner), Navbar (visitor site, logged-out and logged-in states), Footer, AdminSidebar and OwnerSidebar (fixed item lists from design-spec.md), Card, Button, Modal, StatusBadge, Stepper, Table. Add AuthContext, ProtectedRoute (checks role) and api/client.js (adds the token).
Create a temporary /dev/components page that shows each component in each theme so I can check them.
```

**Check:** health route works, themes switch, each portal shows only its own logo. Then create `PROGRESS.md`.

---

## Phase 1: Database layer

**Attach:** `project.md` (section 2 and Phase 1), `WildBook_Normalization_Report.pdf`, `WildBook_Project_Synopsis.pdf`, `PROGRESS.md`. No images.

```
[Standard opening]
Phase 1: Database. Write the files in database/ : 01_schema.sql, 02_triggers.sql, 03_procedures.sql, 04_views.sql, 05_seed.sql, tests.sql.
Use the table list in project.md section 2 exactly (including admin_profiles, admin_documents, cancellations, reviews, booking_code, hold_expires_at). Keep the constraints from the normalization report (UNIQUE email, UNIQUE guide/date/time, UNIQUE vehicle/date/time, UNIQUE booking_id on payments, CHECK constraints, ENUM statuses, cascade only on booking_attendees and sanctuary_images).
Triggers: slot capacity <= vehicle capacity; vehicle and activity in the same sanctuary; only an APPROVED admin can add slots; a review needs a past CONFIRMED booking of the same user.
Procedures: sp_create_booking (transaction, SELECT ... FOR UPDATE on the slot, count CONFIRMED plus unexpired PENDING seats, create PENDING booking with a 10 minute hold and a PENDING payment, return NOT_ENOUGH_SEATS if full), sp_confirm_payment, sp_cancel_booking (40% fee, 60% refund, writes cancellations, payment PARTIALLY_REFUNDED), and an event or procedure that marks expired PENDING bookings EXPIRED.
Views: v_public_sanctuaries, v_slot_availability, v_confirmed_bookings. Add the indexes listed in project.md.
Seed: one SITE_OWNER, one approved admin, one pending admin, one visitor, two approved sanctuaries with images, activities and slots (some in the past). Create a small Node script that generates bcrypt hashes for the seed passwords.
tests.sql must prove: duplicate email fails, double guide allocation fails, overbooking is rejected (capacity 10, 8 booked: 3 rejected, 2 accepted), cancellation fee maths is right.
```

**Check:** schema runs from scratch; every `tests.sql` result behaves as expected. This phase is the best one to bring back to Claude for a review (see section 5).

---

## Phase 2: Authentication

**Attach:** `project.md` (Phase 2), `design-spec.md`, `PROGRESS.md`, images `02`, `03`, `13`, `14`, `15`, `21`.

```
[Standard opening]
Phase 2: Authentication for all three portals. Pages: 02 visitor login, 03 visitor signup, 13 admin login, 14 admin signup, 15 admin pending, 21 owner login.
Backend /api/auth: POST user/signup (VISITOR, APPROVED), POST user/login, admin/login, owner/login (each rejects the wrong role; admin login also rejects PENDING, REJECTED, SUSPENDED with distinct messages that include the owner's note when there is one), POST admin/signup (ADMIN, PENDING; saves admin_profiles and three uploaded documents with multer into backend/uploads/admin-docs, private), GET /me.
Middleware: authRequired, requireRole, requireApprovedAdmin. bcrypt, JWT with 2 hour expiry, rate limit on login routes. There is NO owner signup route.
Frontend: build the six pages with validation, show/hide password, password strength bar and file inputs on admin signup (license, identity proof, authorization letter, plus designation, registered address, website), clear error messages. After login redirect to /, /admin or /owner by role. The pending page (15) shows only the status stepper and Log out (no full sidebar). Protect routes with ProtectedRoute.
```

**Check:** visitor token on an admin route gives 403; pending admin cannot reach `/admin`; owner login works with the seeded account.

---

## Phase 3: Site Owner approves admins

**Attach:** `project.md` (Phase 3), `design-spec.md`, `PROGRESS.md`, image `23`. Also mention `backend/middleware/auth.js` and `routes/auth` so it reuses them.

```
[Standard opening]
Phase 3: Site Owner approves admins. Page: 23 admin requests, plus the owner layout with the fixed five-item sidebar.
Backend (role SITE_OWNER only): GET /api/owner/admins with status, search, sort, page and tab counts; GET /api/owner/admins/:id (profile and documents); GET /api/owner/admins/:id/documents/:docId that streams the file to the owner only; PATCH /api/owner/admins/:id with { decision: APPROVED | REJECTED | SUSPENDED, note } (note required for reject). Store reviewed_by, reviewed_at, review_note.
Frontend: tabs with counts, search, sortable table, pagination, right detail panel (personal info, organisation info, document downloads, notes), Approve / Reject / Suspend buttons. Use the owner theme.
```

**Check:** approving a pending admin lets them log in; rejecting shows the note at their login.

---

## Phase 4: Admin sanctuaries (draft and images)

**Attach:** `project.md` (Phase 4), `design-spec.md`, `PROGRESS.md`, images `17`, `18`.

```
[Standard opening]
Phase 4: Admin sanctuaries. Pages: 17 my sanctuaries, 18 add or edit sanctuary. Also build the admin layout with the fixed six-item sidebar.
Backend (ADMIN, approved, ownership checked on every row): POST/GET/PUT /api/admin/sanctuaries, GET /api/admin/sanctuaries/:id; image upload POST /api/admin/sanctuaries/:id/images with multer (jpg, png, webp, 2 MB each, random file names, max 10), PATCH for cover and sort order, DELETE that removes the DB row and the file. Block edits while listing_status is PENDING.
Frontend: status chips (Draft, Pending, Approved, Rejected), rejected card with the reviewer note and Edit and resubmit, add/edit form with sections (basic info, drag and drop upload, cover star, reorder, contact, hours and operating days). Save draft works now. Submit for approval is shown but disabled with a tooltip (Phase 6).
```

**Check:** draft with images works; deleting an image removes the file from disk; one admin cannot open another's sanctuary.

---

## Phase 5: Activities, guides, vehicles, slots

**Attach:** `project.md` (Phase 5), `design-spec.md`, `PROGRESS.md`, image `19`.

```
[Standard opening]
Phase 5: Activities and slots. Page: 19, plus add/edit dialogs for guides and vehicles.
Backend: CRUD for /api/admin/activities, /guides, /vehicles, /slots scoped to the admin's own sanctuary. GET /api/admin/slots?sanctuary_id=&week= returns the week with seats booked per slot. Map the database trigger and UNIQUE errors to clear messages (capacity above vehicle, guide or vehicle already used at that date and time). A slot with confirmed bookings cannot change date, time or capacity. Use is_active instead of deleting anything that has bookings.
Frontend: activity list (add, edit, delete, price per person), weekly calendar with coloured blocks (time, guide, vehicle, seats like 6/6), week navigation, Today button, right Add slot panel.
```

**Check:** the two error cases show readable messages; a full activity and slot set exists for one sanctuary.

---

## Phase 6: Submit for approval and owner reviews sanctuaries

**Attach:** `project.md` (Phase 6), `design-spec.md`, `PROGRESS.md`, image `24`. Mention the Phase 4 files for pages 17 and 18 so it enables the Submit button there.

```
[Standard opening]
Phase 6: Submit and review. Page: 24 sanctuary review, plus an Approved Sanctuaries list page for the owner (no image: reuse the table style of page 23).
Backend: POST /api/admin/sanctuaries/:id/submit (requires at least one image, one activity and one slot; sets PENDING). Owner: GET /api/owner/sanctuaries?status=, GET /api/owner/sanctuaries/:id (details, gallery, activities with prices, slots summary per activity), PATCH /api/owner/sanctuaries/:id with { decision: APPROVED | REJECTED, note } (note required for reject), storing reviewed_by and reviewed_at.
Frontend: enable Submit for approval on page 18 and Edit and resubmit on page 17. Owner page 24: preview, gallery, activities and slots summary, three checklist checkboxes (Approve and list enabled only when all three are ticked), note box, Reject with note.
```

**Check (big milestone):** admin submits, owner approves, the sanctuary shows in `v_public_sanctuaries`. Reject, edit, resubmit also works. Commit and tag it `v0.6`.

---

## Phase 7: Visitor browsing

**Attach:** `project.md` (Phase 7), `design-spec.md`, `PROGRESS.md`, images `01`, `04`, `05`, `06`, plus the hero photos you want in the carousel.

```
[Standard opening]
Phase 7: Visitor browsing. Pages: 01 home, 04 browse sanctuaries, 05 sanctuary detail, 06 activity and slot selection.
Backend (public): GET /api/sanctuaries (search, location, activity, rating, page), GET /api/sanctuaries/featured, GET /api/sanctuaries/:id (gallery, activities, hours, best time, coordinates, average rating), GET /api/activities/:id/slots?date= using v_slot_availability and hiding past slots. Only APPROVED sanctuaries; anything else returns 404.
Frontend: Home is a long scrolling page. The hero is a carousel of animal photos that slides left (translateX), auto every 5 seconds, pauses on hover, with clickable dots; headline and search bar stay fixed over it. Then featured sanctuaries, ways to explore, steps, testimonials. Browse has search, filters and pagination. Detail has gallery, activities with View slots, Open in Google Maps link from coordinates, hours, and an empty reviews block. Slots page has calendar, slot chips with seats left (sold out disabled), people counter, live total, and Continue to booking (logged-out users go to login and return).
```

**Check:** home to slot selection with correct seats left; an unapproved sanctuary URL gives 404.

---

## Phase 8: Booking and payment

**Attach:** `project.md` (Phase 8), `design-spec.md`, `PROGRESS.md`, images `07`, `08`, `09`, plus `database/03_procedures.sql`.

```
[Standard opening]
Phase 8: Booking and payment. Pages: 07 booking details, 08 payment, 09 booking confirmed.
Backend: POST /api/bookings { slot_id, attendees[] } validates that attendee count equals number of people, then calls sp_create_booking in one transaction (lock the slot, check capacity, PENDING booking with 10 minute hold, attendees, PENDING payment). GET /api/bookings/:id (owner only, with remaining hold seconds). POST /api/payments/:bookingId/pay as a MOCK (body decides success or failure): success calls sp_confirm_payment and returns booking_code (format WB-000101); failure sets payment FAILED and keeps the booking PENDING until the hold ends. GET /api/bookings/:id/ticket generates a PDF with a QR code on request (CONFIRMED and owned by the caller only; do not store tickets). jobs/expireHolds.js runs every minute and marks expired PENDING bookings EXPIRED.
Frontend: attendee cards (name, age, ID type, ID number) with Add another attendee, summary card with the 40% cancellation warning, payment tabs (UPI, card, net banking, all mock), countdown from the server's remaining hold time, pay button with failure and retry, confirmation page with the booking ID in the ticket box and Download ticket.
Show one "Safari charges" line plus the total, not the extra fee lines from the image.
```

**Check:** two simultaneous requests for the last seats give exactly one success; paying after expiry is rejected; attendee mismatch rolls back.

---

## Phase 9: My bookings and cancellation

**Attach:** `project.md` (Phase 9), `design-spec.md`, `PROGRESS.md`, images `10`, `11`.

```
[Standard opening]
Phase 9: My bookings and cancellation. Pages: 10 my bookings, 11 cancel modal.
Backend: GET /api/bookings/mine?tab=upcoming|past|cancelled, GET /api/bookings/:id/cancel-preview (amount paid, fee, refund), POST /api/bookings/:id/cancel using sp_cancel_booking. Compute the fee only on the server. Only CONFIRMED bookings whose slot has not started can be cancelled.
Frontend: tabs and cards with status badges. Buttons by state: Upcoming gets View ticket and Cancel; Past gets View ticket and Write a review; Cancelled gets View ticket only. The modal shows amount paid, 40% fee in red, 60% refund in green, then Keep booking or Confirm cancellation.
```

**Check:** seats-left rises after a cancel; the cancellations row has the right fee and refund.

---

## Phase 10: Reviews

**Attach:** `project.md` (Phase 10), `design-spec.md`, `PROGRESS.md`, images `12`, `05`.

```
[Standard opening]
Phase 10: Reviews. Page: 12 write a review, plus the reviews block on page 05. Review photos are NOT part of version 1: remove the photo upload from the form.
Backend: POST /api/reviews (booking CONFIRMED, owned by the caller, slot in the past, no existing review for that booking), GET /api/sanctuaries/:id/reviews?page=, and include average rating and counts per star in the sanctuary detail response.
Frontend: star rating, comment with character counter, submit. On page 05 show the average, the 5-to-1 bars and review cards. The Write a review button on My Bookings opens this page.
```

**Check:** no past booking is rejected; a second review for the same booking is rejected; the average updates.

---

## Phase 11: Admin bookings, dashboards and reports

**Attach:** `project.md` (Phase 11), `design-spec.md`, `PROGRESS.md`, images `20`, `16`, `22`.

```
[Standard opening]
Phase 11: Bookings and dashboards. Pages: 20 admin bookings, 16 admin dashboard, 22 owner dashboard, plus a Reports page for each portal (no image: reuse the table and chart style).
Backend: admin bookings list with filters and pagination (own sanctuary only), booking detail with attendees (ID numbers shown as last 4 characters only), CSV export, GET /api/admin/stats (totals, revenue net of refunds, upcoming slots, average rating, bookings per day, revenue per activity, recent bookings). GET /api/owner/stats (pending admins, pending sanctuaries, approved sanctuaries, total bookings, bookings per sanctuary, approvals over time, latest pending requests). Reports as SQL: most-booked sanctuaries, frequent bookers, monthly revenue per sanctuary including cancellation fees kept, slot occupancy, cancellation rate. Include one subquery and one GROUP BY with HAVING.
Frontend: tables, drawer, Export, stat cards and Chart.js charts. The owner's Needs your attention rows link to the review pages. Use rupees everywhere.
```

**Check:** each dashboard number matches a direct SQL query.

---

## Phase 12: Polish, security, tests, documents

**Attach:** `project.md` (Phase 12 and the test table), `design-spec.md`, `PROGRESS.md`, image `25`.

```
[Standard opening]
Phase 12: Polish. Build the 404 page (image 25) for route * using the shared navbar and footer. Then go through every page: add loading, empty and error states, friendly messages (sold out, payment failed, pending approval), responsive layouts for the visitor site, and server and client validation. Run the security checklist in project.md Phase 12 and report anything that fails. Write test scripts or a Postman collection for T1 to T16, README.md with setup steps and seed logins, and docs/test-results.md. Do not add new features.
```

**Check:** all tests pass. Update the ER diagram, schema diagram and normalization report yourself (or ask Claude, section 5).

---

## 5. When to come back to Claude (this chat)

Use Claude for review and unsticking, not for building pages:

| When | What to send |
|---|---|
| After Phase 1 | `database/*.sql`. Ask for a review of constraints, triggers, procedure correctness and race conditions |
| A bug the AI cannot fix after 2 tries | The error message, the file, and the request that triggers it |
| Before Phase 12 | `schema.sql` and your three diagrams, to update the ER diagram and normalization report |
| Before the viva | `project.md`, `database/*.sql`. Ask for likely examiner questions and answers |

Bug report template:

```
Phase: 8. Page: payment.
What I did: ...
What I expected: ...
What happened: (paste the exact error or response)
Files involved: (attach them)
```

## 6. Common mistakes to avoid

- Sending all images and asking for the whole project in one go.
- Letting the AI skip the role and ownership checks "for now". Add them in the first version of each route.
- Letting it add Redux, ORMs or extra libraries that are not in `project.md`. If it wants one, ask why first.
- Storing images or admin documents in a public folder. Admin documents are never public.
- Moving to the next phase with failing "Done when" checks. A bug in booking logic is much harder to find after the dashboards are built on top.
