# WildBook — Progress

## Phase 0: Foundation ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend
- Express server (`backend/server.js`) with CORS, JSON body-parser, central error handler
- `mysql2` promise pool in `config/db.js` (connection limit 10, UTC timezone)
- `GET /api/health` runs `SELECT 1`, returns `{ status, db, timestamp }`
- Static serving of `/uploads/sanctuaries` only (admin-docs are NOT exposed)
- Centralized error handler returning clean JSON error responses

#### Frontend
- Vite + React 19 + React Router 7 + Tailwind CSS v4
- Three CSS theme files with exact design-spec.md token values (`theme-user.css`, `theme-admin.css`, `theme-owner.css`)
- Shared components: `Logo`, `Navbar`, `Footer`, `AdminSidebar`, `OwnerSidebar`, `Card`, `Button`, `Modal`, `StatusBadge`, `Stepper`, `Table`
- `AuthContext`, `ProtectedRoute`, `api/client.js`
- `/dev/components` component catalog and theme switcher

---

## Phase 1: Database layer ✅ COMPLETE

**Date:** 2026-10-21

### What works
- 14 normalized (3NF/BCNF) tables created in MySQL 8.0 (`01_schema.sql`)
- Triggers enforcing capacity, same-sanctuary consistency, approved admin check, and past confirmed booking check (`02_triggers.sql`)
- Stored procedures: `sp_create_booking`, `sp_confirm_payment`, `sp_cancel_booking`, `sp_expire_pending_bookings`, and 1-minute cleanup event (`03_procedures.sql`)
- Analytical views: `v_public_sanctuaries`, `v_slot_availability`, `v_confirmed_bookings` (`04_views.sql`)
- Seed accounts with real bcrypt hashes (`05_seed.sql`):
  - Owner: `owner@wildbook.com` / `Owner@123`
  - Approved Admin: `admin.nagarhole@wildbook.com` / `Admin@123`
  - Pending Admin: `admin.bandipur@wildbook.com` / `Admin@123`
  - Visitor: `visitor@wildbook.com` / `Visitor@123`
- Automated test suite with 13/13 passing assertions (`tests.sql`, `run_all.js`)

---

## Phase 2: Authentication ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend (`/api/auth`)
- `POST /api/auth/user/signup`: Registers `VISITOR` with status `APPROVED`, hashes password with bcrypt, returns 2-hour JWT
- `POST /api/auth/user/login`: Validates credentials, enforces role `VISITOR`, rejects other portal roles, login rate-limited
- `POST /api/auth/admin/login`: Validates credentials, requires role `ADMIN`. Rejects `PENDING`, `REJECTED`, `SUSPENDED` with distinct status messages and reviewer notes
- `POST /api/auth/owner/login`: Strictly requires `SITE_OWNER`. (No owner signup route)
- `POST /api/auth/admin/signup`: Multipart/form-data upload using multer, stores private documents (License, Identity Proof, Authorization Letter) in `backend/uploads/admin-docs/`. Inserts `admin_profiles` metadata and creates `ADMIN` user with `PENDING` status
- `GET /api/auth/me`: Authenticated user profile lookup, attaches `admin_profiles` details for administrators, never returns `password_hash`
- Middleware suite:
  - `authRequired`: Validates Bearer JWT signature and expiration, retrieves active user from database
  - `requireRole(...roles)`: Verifies role authorization
  - `requireApprovedAdmin`: Enforces `role === 'ADMIN'` and `account_status === 'APPROVED'`
  - `loginRateLimiter`: Express rate limiting on authentication routes (30 requests per 15 minutes)

#### Frontend Pages
- **02 Visitor Login (`/login`)**: Matching visual reference with forest background, John Muir quote, email and password inputs with show/hide toggle, error alerts, and redirect handling
- **03 Visitor Signup (`/signup`)**: Matching visual reference with stag hero background, full name, email, phone, password with confirmation, terms agreement checkbox, and amber button
- **13 Admin Login (`/admin/login`)**: Matching visual reference with misty forest backdrop, admin branding, show/hide password, and automatic redirect to `/admin/pending` if account is pending
- **14 Admin Signup (`/admin/signup`)**: Matching visual reference with elephant forest path, operator feature bullets, full organisation profile fields, dynamic password strength meter (Weak / Medium / Strong), and 3 file pickers for verification documents
- **15 Admin Pending (`/admin/pending`)**: Matching visual reference with custom animated hourglass illustration, status stepper (Submitted -> Under review -> Approved), rejection alert display with review note, and Log Out button with no sidebar
- **21 Owner Authority Portal Login (`/owner/login`)**: Matching visual reference with deep redwood forest background, gold authority seal, email and password fields, security badge "Authorised personnel only", and strictly NO signup option
- **Routing & Navigation**: Fully hooked in `frontend/src/App.jsx` with `ProtectedRoute` guards and automatic post-login redirection based on role (`/`, `/admin`, `/owner`, or `/admin/pending`)

---

## Phase 3: Site Owner approves admins ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend (`/api/owner`)
- `GET /api/owner/admins`: Filter by status (`ALL`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`), text search (name, email, organisation, license number), sorting (`submitted_desc`, `submitted_asc`, `name_asc`, `name_desc`, `org_asc`), pagination (`page`, `limit`), and returns live counts per status tab
- `GET /api/owner/admins/:id`: Detailed view of administrator, organisation details, reviewer audit history, and list of uploaded verification documents with formatted byte sizes
- `GET /api/owner/admins/:id/documents/:docId`: Secure streaming endpoint delivering private PDF/Image verification documents to `SITE_OWNER` only with proper `Content-Type` and `Content-Disposition` headers
- `PATCH /api/owner/admins/:id`: Decision endpoint for `APPROVED`, `REJECTED`, `SUSPENDED`. Requires review note for `REJECTED`. Automatically updates `reviewed_by = req.user.user_id`, `reviewed_at = NOW()`, and `review_note`
- Middleware protection: all `/api/owner` routes enforced with `authRequired` and `requireRole('SITE_OWNER')`

#### Frontend (`/owner/admin-requests`)
- **OwnerLayout (`OwnerLayout.jsx`)**: Responsive authority shell with fixed 5-item collapsible `OwnerSidebar`, active clearance status, user menu, and logout
- **Page 23 Admin Requests (`AdminRequests.jsx`)**:
  - Live status tabs with counter badges (`All Requests`, `Pending`, `Approved`, `Rejected`, `Suspended`)
  - Real-time text search and filters
  - Sortable table columns (Admin Name, Organisation, License Number, Submitted Date) with status badges and clickable rows
  - Server-backed pagination controls
- **Request Details Drawer (`AdminDetailDrawer.jsx`)**:
  - Slide-out details drawer matching Image 23
  - Personal Information (Full name, Email, Phone, Designation)
  - Organisation Information (Organisation name, License number, Registered address, Website link)
  - Uploaded Documents list with icons, sizes, and secure download triggers using streaming API
  - Review Notes input box (with character count and required validation for rejections)
  - Decision action buttons: `Approve` (green), `Reject` (crimson, validated), `Suspend` (neutral)

### How to run and test

#### 1. Automated Test Suite (8/8 Passed Cleanly)
```powershell
cd backend
node test_owner.js
```
Expected output: `SUMMARY: 8/8 Owner Tests Passed Cleanly!`

#### 2. Running Live in the Browser
- **Owner Login:** [http://localhost:5173/owner/login](http://localhost:5173/owner/login)
  - Log in with: `owner@wildbook.com` / `Owner@123`
- **Admin Requests Page:** [http://localhost:5173/owner/admin-requests](http://localhost:5173/owner/admin-requests)
  - View all admin requests and tab counts.
  - Switch tabs (`Pending`, `Approved`, `Rejected`, `Suspended`).
  - Click on any admin row (e.g. Bandipur Trust or new registration) to open the right drawer.
  - Download attached verification documents.
  - Approve or Reject with notes.
- **Verify Operator Login Effect:**
  - If approved $\to$ admin can log in at `/admin/login` and access `/admin`.
  - If rejected or suspended $\to$ login at `/admin/login` is blocked and displays the exact rejection note.

---

## Phase 4: Admin sanctuaries (draft and images) ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend (`/api/admin/sanctuaries`)
- Middleware & Authorization:
  - `authRequired`, `requireRole('ADMIN')`, `requireApprovedAdmin` applied to all routes.
  - Strict ownership check on every query: `WHERE sanctuary_id = ? AND admin_id = ?`.
  - Edit blocking when `listing_status === 'PENDING'`: returns 400 bad request with error `"Cannot edit a sanctuary while it is under review (PENDING)"`.
- Endpoints:
  - `GET /api/admin/sanctuaries`: Lists all sanctuaries owned by the authenticated admin, with cover image (`is_cover = TRUE`), image count, reviewer note, and formatted timestamps.
  - `GET /api/admin/sanctuaries/:id`: Returns full sanctuary details with its ordered image gallery.
  - `POST /api/admin/sanctuaries`: Creates a new sanctuary in `DRAFT` status with parameterized insert.
  - `PUT /api/admin/sanctuaries/:id`: Updates sanctuary basic info, contact details, operating days/hours, and best time to visit. Edits strictly blocked if status is `PENDING`.
  - `POST /api/admin/sanctuaries/:id/images`: Uploads up to 10 images with `multer` to `backend/uploads/sanctuaries/` (`.jpg`, `.jpeg`, `.png`, `.webp`, 2 MB limit, random filenames). Enforces max 10 images total limit. If it's the first image, automatically sets it as cover (`is_cover = TRUE`).
  - `PATCH /api/admin/sanctuaries/:id/images/:imageId`: Updates `is_cover` (unsetting any existing cover) and `sort_order`.
  - `DELETE /api/admin/sanctuaries/:id/images/:imageId`: Deletes image record from database and unlinks file from disk. If the deleted image was cover, automatically reassigns the first remaining image as cover.

#### Frontend
- **AdminLayout (`frontend/src/pages/admin/AdminLayout.jsx`)**:
  - Fixed collapsible 6-item `AdminSidebar` matching `design-spec.md` (Dashboard, My Sanctuaries, Activities & Slots, Guides & Vehicles, Bookings, Reports).
  - Top header with search, notifications badge, and operator account card with logout action.
- **Page 17: My Sanctuaries (`frontend/src/pages/admin/MySanctuaries.jsx`)**:
  - Matches reference Image 17.
  - Sanctuary cards in a responsive grid displaying cover image (or nature illustration fallback), location pin, status chip (`Draft`, `Pending`, `Approved`, `Rejected`), and last updated date.
  - Special rejected card presentation with prominent reviewer's note banner and primary "Edit and resubmit" action button.
  - "+ Add new sanctuary" header button linking to creation form.
- **Page 18: Add / Edit Sanctuary (`frontend/src/pages/admin/SanctuaryForm.jsx`)**:
  - Matches reference Image 18 with 4 organized sections:
    1. **1. Basic information**: Name, Location, Description (with character count), and Best time to visit.
    2. **2. Image upload**: Drag-and-drop zone with file browser, 4/10 image counter, thumbnail strip with cover star indicator, hover actions (star as cover, delete), and client/server validation.
    3. **3. Contact information**: Email address, Phone number, and Website URL.
    4. **4. Hours of operation**: Opening and closing hours time pickers, multi-select pill buttons for operating days (`Mon` through `Sun`).
  - Bottom sticky action bar with "Save draft" (fully operational) and "Submit for approval" (shown but disabled with tooltip explaining it will be enabled in Phase 6).
- **Routing & Protection**:
  - Wired in `frontend/src/App.jsx` with `ProtectedRoute` for `/admin/sanctuaries`, `/admin/sanctuaries/new`, and `/admin/sanctuaries/:id/edit`.

---

### How to run and test

#### 1. Automated Test Suite (8/8 Passed Cleanly)
```powershell
cd backend
node test_admin_sanctuary.js
```
Expected output: `SUMMARY: 8/8 Admin Sanctuary Tests Passed Cleanly!`

#### 2. Running Live in the Browser
- **Admin Login:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
  - Log in with: `admin.nagarhole@wildbook.com` / `Admin@123`
- **My Sanctuaries Page:** [http://localhost:5173/admin/sanctuaries](http://localhost:5173/admin/sanctuaries)
  - View existing sanctuaries (e.g., Nagarhole National Park).
  - View status badges (`Draft`, `Approved`, `Pending`, `Rejected`).
  - Click "+ Add new sanctuary" or click "Edit" on a draft/rejected sanctuary.
- **Add / Edit Sanctuary Form:** [http://localhost:5173/admin/sanctuaries/new](http://localhost:5173/admin/sanctuaries/new)
  - Fill out Basic Info, Contact Info, Hours of Operation, and select Operating Days.
  - Drag and drop or browse to upload images (PNG, JPG, WebP < 2MB).
  - Hover on uploaded images to set cover (gold star) or delete.
  - Click "Save draft" $\to$ saves to MySQL and navigates to the edit page with success alert.
  - Hover over "Submit for approval" button to view Phase 6 tooltip.

## Phase 5: Activities and slots ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend (`/api/admin`)
- **Activities CRUD (`/api/admin/activities`)**:
  - `GET /api/admin/activities?sanctuary_id=`: List activities with live booking counts.
  - `POST /api/admin/activities`: Create activity with validation (`duration_minutes > 0`, `price >= 0`).
  - `PUT /api/admin/activities/:id`: Update activity details.
  - `DELETE /api/admin/activities/:id`: Soft-deactivates (`is_active = FALSE`) if past or current bookings exist; deletes if unreferenced.
- **Guides & Vehicles CRUD (`/api/admin/guides`, `/api/admin/vehicles`)**:
  - `GET`, `POST`, `PUT`, `DELETE` scoped strictly to sanctuaries owned by the admin (`s.admin_id = req.user.user_id`).
  - Referential integrity check prevents deleting guides or vehicles that have scheduled slots.
- **Slots CRUD & Calendar Feed (`/api/admin/slots`)**:
  - `GET /api/admin/slots?sanctuary_id=&week=`: Returns weekly slots (Monday to Sunday) with dynamically computed `booked_seats` (`CONFIRMED` + active `PENDING` holds) and `available_seats`.
  - `POST /api/admin/slots`: Schedules slot with trigger and constraint error mapping:
    - Exceeding vehicle capacity $\to$ `400 "Slot capacity cannot exceed vehicle capacity"`
    - Cross-sanctuary guide/vehicle/activity mismatch $\to$ `400 "Vehicle, guide, and activity must belong to the same sanctuary"`
    - Unapproved admin $\to$ `403 "Only an APPROVED admin can add slots"`
    - Double guide assignment at same date & time $\to$ `409 "Guide is already assigned to another slot at this date and time"`
    - Double vehicle assignment at same date & time $\to$ `409 "Vehicle is already assigned to another slot at this date and time"`
  - `PUT /api/admin/slots/:id`: Enforces immutability: slots with confirmed bookings cannot change date, time, or capacity (`400 "A slot with confirmed bookings cannot change date, time or capacity"`).
  - `DELETE /api/admin/slots/:id`: Soft-deactivates (`is_active = FALSE`) if any bookings exist, returning `{ message: "Slot deactivated...", is_active: false }`.

#### Frontend
- **Page 19: Manage Activities & Slots (`frontend/src/pages/admin/ActivitiesSlots.jsx`)**:
  - Matches reference Image 19.
  - 3-column layout:
    1. **Left Column (Activities)**: Activity cards list with color dots, name, price in Rupees (`₹`), duration, active/inactive badge, Edit and Delete actions, and "+ Add activity" modal button.
    2. **Center Column (Weekly Calendar)**: 7-day schedule grid (Monday to Sunday) with colored slot blocks showing time, activity name, assigned guide (`👤`), assigned vehicle (`🚗`), and booked seats ratio (`👥 2/6`). `<` / `>` week navigation, "Today" button, week date range display, and bottom activity color legend dots.
    3. **Right Column (Add / Edit Slot Panel)**: Slide-over form with activity dropdown, guide dropdown, vehicle dropdown (with capacity auto-fill), date picker, time picker, and capacity input with real-time error alert display.
- **Guide & Vehicle Management Modals**:
  - Integrated directly on Page 19 and accessible via sidebar item `/admin/guides`.
  - Allows registering and managing guides (name, phone, experience) and vehicles (type, capacity).
- **Routing**:
  - Connected `/admin/activities-slots` and `/admin/guides` in `frontend/src/App.jsx` with `ProtectedRoute`.

---

### How to run and test

#### 1. Automated Test Suite (14/14 Passed Cleanly)
```powershell
cd backend
node test_admin_phase5.js
```
Expected output: `SUMMARY: All 14 Phase 5 API & Rule Tests Passed Cleanly!`

#### 2. Running Live in the Browser
- **Admin Login:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
  - Log in with: `admin.nagarhole@wildbook.com` / `Admin@123`
- **Activities & Slots Page:** [http://localhost:5173/admin/activities-slots](http://localhost:5173/admin/activities-slots)
  - Switch sanctuary between Nagarhole National Park and others.
  - View activities list with Rupee (`₹`) pricing and color indicators.
  - Click "+ Add activity" or click the pencil icon to edit an activity.
  - Navigate weeks using `<` and `>`, or click "Today".
  - Click any existing slot card in the calendar to edit its properties in the right panel.
  - Notice that locked slots with confirmed bookings display a warning and prevent changing date/time/capacity.
  - Click "+ Add slot" or click any empty slot area to schedule a new safari session.
  - Test conflict error messages by picking a guide/vehicle that is already scheduled at the same date and time.
  - Click "👤 Guides" or "🚙 Vehicles" in the top bar to open their respective management dialogs.

## Phase 6: Submit for approval and Site Owner reviews sanctuaries ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend
- **Admin Sanctuary Submission (`POST /api/admin/sanctuaries/:id/submit`)**:
  - Enforces `authRequired`, `requireRole('ADMIN')`, `requireApprovedAdmin`, and row-level ownership.
  - Validates prerequisites: requires at least 1 image, at least 1 active activity, and at least 1 scheduled slot.
  - Rejects incomplete submissions with `400 Bad Request` and details missing requirements.
  - Updates `sanctuaries` table setting `listing_status = 'PENDING'`, clearing previous `review_note`, `reviewed_by`, and `reviewed_at`.
- **Site Owner Review Queue & Detail (`GET /api/owner/sanctuaries`)**:
  - `GET /api/owner/sanctuaries?status=`: Filters submissions by status (`ALL`, `PENDING`, `APPROVED`, `REJECTED`, `DRAFT`) with live tab counter badges, operator organisation, license, and counts for images, activities, and slots.
  - `GET /api/owner/sanctuaries/:id`: Complete dossier feed returning full gallery images, activities with durations and Rupee prices, and weekday vs. weekend slots summary.
- **Site Owner Decision Endpoint (`PATCH /api/owner/sanctuaries/:id`)**:
  - Enforces decision values `'APPROVED'` or `'REJECTED'`.
  - Rejection requires a non-empty `note` (`400 Bad Request` if omitted).
  - Records `reviewed_by = req.user.user_id` and `reviewed_at = NOW()`.
  - On approval, the sanctuary immediately surfaces in `v_public_sanctuaries` for public visitor discovery.

#### Frontend
- **Page 18 (`frontend/src/pages/admin/SanctuaryForm.jsx`)**:
  - Enabled "Submit for approval" button in bottom action bar.
  - Automatically saves draft changes, checks prerequisites, calls the submit endpoint, and transitions status to `PENDING` with feedback.
- **Page 17 (`frontend/src/pages/admin/MySanctuaries.jsx`)**:
  - "Edit and resubmit" action button on rejected sanctuary cards, linking directly to the editor to allow revising and resubmitting.
- **Page 24: Sanctuary Review (`frontend/src/pages/owner/SanctuaryReview.jsx`)**:
  - Matches reference Image 24.
  - Left Column: Sanctuary submission preview with cover photo, name, status badge, location, submission timestamp, operator details, image gallery with photo enlargement lightbox, full description, and side-by-side tables for "ACTIVITIES & PRICING" and "SLOTS SUMMARY" (weekdays vs weekends).
  - Right Column: 3-point interactive Review Checklist:
    1. *Images verified*
    2. *Details accurate*
    3. *Pricing reasonable*
    - **"Approve and list" button is strictly gated and enabled only when all three checkboxes are ticked**.
    - Review note box with character counter (`0 / 1000`).
    - "Reject with note" danger action button.
- **Approved Sanctuaries List (`frontend/src/pages/owner/ApprovedSanctuaries.jsx`)**:
  - Official registry table reusing Page 23 styles with search, operator details, offerings summary, approval timestamps, and "View Dossier" actions.
- **Sanctuary Requests Queue (`frontend/src/pages/owner/SanctuaryRequests.jsx`)**:
  - Full review queue with live status tabs, search, and direct inspection links to Page 24.

---

### How to run and test

#### 1. Automated Test Suite (12/12 Passed Cleanly)
```powershell
cd backend
node test_phase6.js
```
Expected output: `SUMMARY: All 12 Phase 6 API & Business Rules Passed Cleanly!`

#### 2. Running Live in the Browser
- **Operator Resubmission & Submission (Admin Portal)**:
  - Log in at [http://localhost:5173/admin/login](http://localhost:5173/admin/login) with `admin.nagarhole@wildbook.com` / `Admin@123`.
  - Go to [http://localhost:5173/admin/sanctuaries](http://localhost:5173/admin/sanctuaries).
  - Click "+ Add new sanctuary" or edit an existing draft sanctuary.
  - Ensure at least 1 image, 1 activity, and 1 slot are added.
  - Click "Submit for approval" in the bottom action bar $\to$ status transitions to `Pending`.
- **Site Owner Review (Page 24)**:
  - Log in at [http://localhost:5173/owner/login](http://localhost:5173/owner/login) with `owner@wildbook.com` / `Owner@123`.
  - Go to [http://localhost:5173/owner/sanctuary-requests](http://localhost:5173/owner/sanctuary-requests).
  - Click "Inspect" on any pending submission to open Page 24 ([http://localhost:5173/owner/sanctuary-requests/1](http://localhost:5173/owner/sanctuary-requests/1)).
  - Inspect the gallery photos, description, activities table, and slots summary.
  - Notice the "Approve and list" button is disabled until all 3 checklist checkboxes are checked.
  - Tick the 3 boxes $\to$ "Approve and list" lights up green.
  - Type a review note or click "Approve and list" $\to$ status transitions to `Approved`.
  - Go to [http://localhost:5173/owner/sanctuaries](http://localhost:5173/owner/sanctuaries) to view the newly approved sanctuary listed in the verified registry.

---

## Phase 7: Visitor browsing ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend
- **Public Sanctuary Directory (`GET /api/sanctuaries`)**:
  - Unauthenticated public endpoint querying `v_public_sanctuaries` (strictly approved sanctuaries).
  - Search filter: matches name, location, or description.
  - Location filter: matches state/region.
  - Activity filter: checks existence of active safari matching category.
  - Rating filter: minimum average rating.
  - Pagination: page and limit (default 9 per page) with total count and total pages.
  - Dynamically calculates `starting_price` (`MIN(price)`) across active activities.
- **Featured Sanctuaries (`GET /api/sanctuaries/featured`)**:
  - Returns top-rated approved sanctuaries with cover images and starting price for the homepage.
- **Sanctuary Public Detail (`GET /api/sanctuaries/:id`)**:
  - Detailed view of approved sanctuary including photo gallery (`sanctuary_images`), active activities with durations and prices, operating days, opening/closing hours, best time to visit, and GPS coordinates (`latitude`, `longitude`).
  - Guest reviews list (`reviews`).
  - Security: strictly returns `404 Not Found` for any unapproved (draft, pending, rejected) or non-existent sanctuary.
- **Activity & Slots Discovery (`GET /api/activities/:id/slots?date=`)**:
  - Queries `v_slot_availability` for approved sanctuaries and active activities.
  - Strictly hides past slots (`TIMESTAMP(slot_date, slot_time) > NOW()`).
  - Calculates live remaining seats per slot (`total_capacity - booked_seats`).
  - Returns array of unique upcoming available dates (`available_dates`) to power the frontend interactive calendar.
  - Returns `404 Not Found` if activity does not exist or sanctuary is not approved.

#### Frontend Pages
- **Page 01: Home (`frontend/src/pages/user/Home.jsx`)**:
  - Matches reference Image 01.
  - Hero carousel with sliding animal photos using CSS `translateX`. Auto-slides every 5 seconds, pauses on hover, with interactive indicator dots.
  - Fixed headline ("Discover Wildlife. Preserve Tomorrow."), subtitle, and search bar over the sliding hero.
  - Featured Sanctuaries section ("Places of Refuge, Beauty & Balance") loaded dynamically from `/api/sanctuaries/featured`.
  - "Ways to Explore" section (4x4 Jeep Safari, River Boat Expedition, Guided Birding, Wilderness Canter).
  - 3-step reservation guide ("How it works").
  - "Community Voices" testimonials section with quotes, star ratings, and avatars.
- **Page 04: Discover Sanctuaries (`frontend/src/pages/user/BrowseSanctuaries.jsx`)**:
  - Matches reference Image 04.
  - Filter bar: Location dropdown, Activity types dropdown, Ratings dropdown, and keyword search input.
  - 3-column responsive card grid displaying cover image, name, location pin, rating score, reviews count, description snippet, starting price (`from ₹X / person`), and "View sanctuary" button linking to `/sanctuaries/:id`.
  - Pagination controls.
- **Page 05: Sanctuary Detail (`frontend/src/pages/user/SanctuaryDetail.jsx`)**:
  - Matches reference Image 05.
  - Breadcrumb navigation (`Home > Destinations > India > Sanctuary`).
  - Left column:
    - Large photo hero with 5-photo thumbnail strip and lightbox modal ("View all photos").
    - Sanctuary title, location pin, rating badge with review counter.
    - "About" section with full description.
    - "Activities Offered" grid with activity cards, durations, starting prices, and "View slots" buttons.
    - "Guest Reviews" block with rating score, percentage distribution bars, and review cards.
  - Right column (sticky sidebar):
    - Location preview card with "Open in Google Maps" external link based on coordinates.
    - Opening Hours card (days and hours).
    - Best Time to Visit card.
    - "Book an experience" quick button scrolling down to Activities.
- **Page 06: Activity & Slot Selection (`frontend/src/pages/user/ActivitySlots.jsx`)**:
  - Matches reference Image 06.
  - Left column:
    - Hero activity photo, title, subtitle, and detailed info tags (Duration, Price per person in `₹`, Expert Guide name, Vehicle Type, and What to Carry).
  - Right column (Interactive Reservation Card):
    - "1. Select Date": Interactive month calendar with `<` and `>` month navigation, day tiles with indicator dots on dates that have available slots, past dates disabled, and active day highlight.
    - "2. Select Time Slot": Slot chips with time ranges, remaining seats (`X seats left`), selected slot checkmark, and sold-out slots disabled.
    - "3. Number of People": Stepper `[- 1 +]` bounded between 1 and available slot capacity.
    - Live Total Price calculation (`₹(price * people)`).
    - "Continue to booking &rarr;" button: routes logged-in users to `/book/:slotId?people=X` (Phase 8) or redirects unauthenticated visitors to `/login?redirect=/activities/:id`.
- **Theme & Identity**:
  - Enforces `theme-user`, `Logo portal="user"`, Rupee sign (`₹`), shared `Navbar` and `Footer`.

---

### How to run and test

#### 1. Automated Test Suite (10/10 Passed Cleanly)
```powershell
cd backend
node test_phase7.js
```
Expected output: `SUMMARY: All 10 Phase 7 Public API Tests Passed Cleanly!`

#### 2. Running Live in the Browser
- **Home Page (Page 01):** [http://localhost:5173/](http://localhost:5173/)
  - Observe sliding animal carousel every 5 seconds.
  - Hover over carousel to pause; click indicator dots to jump between slides.
  - Test fixed search bar over the hero.
  - View Featured Sanctuaries cards with live `starting_price` in Rupees (`₹`).
  - Scroll through "Ways to Explore", 3-step guide, and testimonials.
- **Browse Sanctuaries (Page 04):** [http://localhost:5173/sanctuaries](http://localhost:5173/sanctuaries)
  - Test Location dropdown (e.g. Karnataka).
  - Test Activity dropdown (e.g. Jeep).
  - Test Rating dropdown.
  - Click "View sanctuary" on any card.
- **Sanctuary Detail (Page 05):** [http://localhost:5173/sanctuaries/1](http://localhost:5173/sanctuaries/1)
  - Inspect photo gallery and click thumbnails or "View all photos".
  - Click "Open in Google Maps" in the right sidebar.
  - View opening hours and best time to visit.
  - Click "View slots" on any activity card (e.g. Morning 4x4 Jeep Safari).
- **Activity & Slot Selection (Page 06):** [http://localhost:5173/activities/1](http://localhost:5173/activities/1)
  - Notice green indicator dots on dates with open slots.
  - Select November 20, 2026 $\to$ time slot chips display remaining seats.
  - Click a slot chip $\to$ checkmark appears.
  - Use `+` and `-` to adjust participants; observe live total price update.
  - Click "Continue to booking" $\to$ if logged out, prompts redirect to `/login?redirect=...`.

---

## Phase 8: Booking and payment ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend
- **Booking Creation (`POST /api/bookings`)**:
  - Validates that attendee count equals `number_of_people` (`attendees.length >= 1`).
  - Validates each attendee: non-empty name, valid age (`> 0`), ID type (`AADHAAR`, `PASSPORT`, `DRIVING_LICENSE`, `VOTER_ID`, `PAN`), non-empty ID number.
  - Calls `sp_create_booking` in MySQL within an atomic transaction: locks slot row (`FOR UPDATE`), checks real-time available capacity against active holds, creates `PENDING` booking with 10-minute hold (`DATE_ADD(NOW(), INTERVAL 10 MINUTE)`), generates `WB-XXXXXX` code (e.g. `WB-000101`), creates `PENDING` payment row.
  - Inserts individual attendees into `booking_attendees`.
  - Returns `201 Created` with booking ID, formatted code, and server remaining hold seconds.
- **Booking Detail (`GET /api/bookings/:id`)**:
  - Protected route requiring authentication.
  - Enforces strict caller ownership: rejects non-owner with `403 Forbidden` (`req.user.user_id !== booking.user_id` and role is not `SITE_OWNER`).
  - Returns sanctuary name, location, activity details, slot date, slot time, attendees list, payment status, and server `remaining_hold_seconds` calculated via MySQL `GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), hold_expires_at))`.
- **Slot Checkout Info (`GET /api/bookings/slot/:slotId`)**:
  - Fetches slot metadata, capacity, available seats, activity pricing, and sanctuary details to power the frontend booking flow.
- **Mock Payment Processor (`POST /api/payments/:bookingId/pay`)**:
  - Protected route requiring authentication and booking ownership.
  - Body decides success or failure:
    - `{ success: true }`: Executes `sp_confirm_payment(booking_id, tx_ref, @pay_status)` within a transaction, marks booking `CONFIRMED`, payment `PAID`, clears hold timer, and returns confirmed `booking_code`.
    - `{ success: false }`: Sets payment status to `FAILED`, preserves booking in `PENDING` status with hold active so user can retry before the 10-minute hold expires.
- **Dynamic In-Memory PDF Ticket Generator (`GET /api/bookings/:id/ticket`)**:
  - Protected route requiring authentication and caller ownership.
  - Enforces `CONFIRMED` status only (unconfirmed/pending bookings return `400 Bad Request`).
  - Generates a branded A4 PDF ticket using `pdfkit` and `qrcode` in-memory with QR code, reservation code, sanctuary & activity info, safari time, attendee passenger list, and guidelines.
  - Streams directly to the browser (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="WildBook_Ticket_WB-XXXXXX.pdf"`). Tickets are never stored on disk.
- **Background Hold Expiration Job (`backend/jobs/expireHolds.js`)**:
  - Runs automatically every 60 seconds on server boot.
  - Executes `sp_expire_pending_bookings`, marking abandoned `PENDING` bookings `EXPIRED` and payments `FAILED`.

#### Frontend Pages
- **Page 07: Booking Details (`frontend/src/pages/user/BookingDetails.jsx`)**:
  - Matches reference Image 07.
  - Stepper indicator: `['Details', 'Payment', 'Confirmation']` (`currentStep = 0`).
  - Attendee cards: Number badge, Full Name, Age, ID Type dropdown, ID number, and "Remove" option for multi-attendee bookings.
  - "+ Add another attendee" button, capped at slot remaining capacity.
  - "Your Booking" summary card: single "Safari charges (₹X × Y)" line plus total (as explicitly required: no extra fee lines).
  - 40% cancellation policy warning alert.
  - "Proceed to payment →" button locking seats and transitioning to `/pay/:bookingId`.
- **Page 08: Secure Payment (`frontend/src/pages/user/Payment.jsx`)**:
  - Matches reference Image 08.
  - Stepper indicator: `['Select Safari', 'Payment', 'Confirmation']` (`currentStep = 1`).
  - Payment method tabs: Card (card number, name, expiry, CVV), UPI (VPA input, UPI apps badges), Net Banking (bank selector).
  - Interactive test simulation mode toggle: allows simulating Success or Failure for retry testing.
  - Live server hold countdown timer: `MM:SS` ticking down from server's `remaining_hold_seconds`. Turns red and disables payment when hold lapses.
  - "🔒 Pay ₹X,XXX" button with failure alert and retry workflow.
- **Page 09: Booking Confirmed (`frontend/src/pages/user/BookingConfirmed.jsx`)**:
  - Matches reference Image 09.
  - Full stepper: `['Choose Experience', 'Select Date & Time', 'Add Attendees', 'Review & Pay', 'Booking Confirmed']` (`currentStep = 4`).
  - Success hero badge: green leaf checkmark with "Your adventure is booked!".
  - Perforated ticket box: "YOUR BOOKING ID" with prominent `WB-XXXXXX` booking code and verified badge.
  - 2-column details grid: Sanctuary, Date, Activity, Departure Time, Attendees chips, and Total Amount.
  - "📥 Download ticket" button triggering direct in-memory PDF ticket download with QR code.
- **Routing (`frontend/src/App.jsx`)**:
  - Wired `/book/:slotId`, `/pay/:bookingId`, and `/booking/:id/confirmed` with `ProtectedRoute` redirecting unauthenticated visitors to `/login`.

---

### How to run and test

#### 1. Automated Test Suite (27/27 Passed Cleanly)
```powershell
cd backend
node test_phase8.js
```
Expected output: `SUMMARY: 27 Passed, 0 Failed`

#### 2. Running Live in the Browser
- **Step 1 — Slot Selection:** Log in as visitor (`visitor@wildbook.com` / `Visitor@123`), navigate to [http://localhost:5173/activities/1](http://localhost:5173/activities/1). Pick a future date (e.g. Nov 20, 2026), select a slot, and click "Continue to booking".
- **Step 2 — Booking Details (Page 07):** Navigates to `/book/:slotId?people=X`. Fill in Attendee 1 details, click "+ Add another attendee", fill in details, observe the single "Safari charges" line and 40% cancellation warning. Click "Proceed to payment".
- **Step 3 — Secure Payment (Page 08):** Navigates to `/pay/:bookingId`. Observe live `10:00` countdown timer. Switch between Card, UPI, and Net Banking tabs.
  - Test failure: Toggle simulation to "Failure" and click Pay $\to$ observe payment failure message and retry button while hold remains active.
  - Test success: Toggle simulation to "Success" and click Pay $\to$ succeeds and redirects to confirmation.
- **Step 4 — Booking Confirmed (Page 09):** Navigates to `/booking/:id/confirmed`. View `WB-XXXXXX` booking code in the perforated ticket box and click "📥 Download ticket" to download the PDF ticket with QR code.

---

## Phase 9: My bookings and cancellation ✅ COMPLETE

**Date:** 2026-10-21

### What works

#### Backend
- **Visitor Bookings Listing (`GET /api/bookings/mine?tab=upcoming|past|cancelled`)**:
  - Enforces `authRequired` authentication middleware and scopes queries strictly to `b.user_id = req.user.user_id`.
  - Filters by tab:
    - `upcoming`: `b.status = 'CONFIRMED' AND TIMESTAMP(s.slot_date, s.slot_time) > NOW()`.
    - `past`: `b.status = 'CONFIRMED' AND TIMESTAMP(s.slot_date, s.slot_time) <= NOW()`.
    - `cancelled`: `b.status = 'CANCELLED'`.
  - Returns formatted booking rows with attached cover images, sanctuary details, slot time, total amount, passenger counts, cancellation breakdown, and review data.
  - Returns real-time aggregate count badge metadata for all three tabs (`upcoming`, `past`, `cancelled`).
- **Cancellation Preview (`GET /api/bookings/:id/cancel-preview`)**:
  - Validates caller ownership (`req.user.user_id === booking.user_id` or `SITE_OWNER`).
  - Restricts cancellation strictly to `CONFIRMED` bookings whose scheduled slot departure has not yet started (`TIMESTAMP(s.slot_date, s.slot_time) > NOW()`). Past or unconfirmed bookings return `400 Bad Request`.
  - Computes cancellation charges strictly on the server: `40% cancellation fee` and `60% refund amount`.
- **Cancellation Execution (`POST /api/bookings/:id/cancel`)**:
  - Validates caller ownership (`403 Forbidden` for non-owners).
  - Calls MySQL stored procedure `sp_cancel_booking` within an atomic transaction.
  - Locks the booking row `FOR UPDATE`, enforces `CONFIRMED` status, confirms the safari slot has not yet departed, and records cancellation audit entry in `cancellations` (with exact 40% fee and 60% refund).
  - Updates `bookings.status = 'CANCELLED'` and `payments.payment_status = 'PARTIALLY_REFUNDED'`.

#### Frontend Pages
- **Page 10: My Bookings (`frontend/src/pages/user/MyBookings.jsx`)**:
  - Matches reference Image 10 styling and layout under `theme-user`.
  - Interactive tabs for `Upcoming`, `Past`, and `Cancelled` with badge counters.
  - Booking cards displaying sanctuary cover thumbnail, sanctuary title, activity title, formatted date, departure time, passenger count, and `Booking ID: WB-XXXXXX`.
  - Dynamic status badges:
    - Upcoming: `✓ Confirmed` (emerald badge).
    - Past: `⏱ Past` (stone badge).
    - Cancelled: `✕ Cancelled` (rose badge).
  - State-specific button matrix:
    - **Upcoming**: `📄 View ticket` (downloads PDF) and `✕ Cancel booking` (opens Page 11 Cancel Modal).
    - **Past**: `📄 View ticket` (downloads PDF) and `⭐ Write a review` (routes to `/review/:bookingId`).
    - **Cancelled**: `📄 View ticket` (downloads PDF pass).
- **Page 11: Cancel Booking Modal (`frontend/src/components/CancelBookingModal.jsx`)**:
  - Matches reference Image 11 modal design.
  - Warning badge icon with clear headline: "Cancel this booking?".
  - Mini summary card with sanctuary cover photo, title, date, guests, and booking code.
  - Financial breakdown:
    - Amount paid in neutral font (`₹X,XXX`).
    - 40% cancellation fee in bold red (`- ₹X,XXX`).
    - 60% refund amount in bold green (`₹X,XXX`).
  - Explanatory note regarding 7–10 business days processing time.
  - Action buttons: "🌿 Keep booking" (closes modal) and "✕ Confirm cancellation" (executes cancellation with loading feedback).
- **Routing (`frontend/src/App.jsx`)**:
  - Mounted `/my-bookings` with `ProtectedRoute` redirecting unauthenticated users to `/login`.

---

### How to run and test

#### 1. Automated Test Suite (28/28 Passed Cleanly)
Run the test suite from `backend/`:
```powershell
cd c:\WILDBOOK\backend
node test_phase9.js
```
Expected output: `SUMMARY: 28 Passed, 0 Failed`

#### 2. Running Live in the Browser
- **Step 1 — View Bookings:** Log in as visitor (`visitor@wildbook.com` / `Visitor@123`), navigate to [http://localhost:5173/my-bookings](http://localhost:5173/my-bookings).
- **Step 2 — Inspect Tabs:**
  - Click **Upcoming**: Observe confirmed future safari bookings with `View ticket` and `Cancel booking` buttons.
  - Click **Past**: Observe past completed visits (such as seed booking #1) with `View ticket` and `Write a review` buttons.
  - Click **Cancelled**: Observe cancelled reservations displaying `View ticket` only.
- **Step 3 — Test Cancellation Modal (Page 11):**
  - On the **Upcoming** tab, click `Cancel booking` on any confirmed booking card.
  - Modal opens: verify the server-calculated breakdown (40% fee in red, 60% refund in green).
  - Click `Keep booking` $\to$ modal closes without modifying the reservation.
  - Click `Cancel booking` again and click `Confirm cancellation` $\to$ booking is cancelled atomically, notification appears, and booking automatically moves to the **Cancelled** tab.
- **Step 4 — View Ticket:**
  - Click `View ticket` on any booking $\to$ the official PDF safari permit with QR code is downloaded in-memory.

---

## Phase 10: Reviews ✅ COMPLETE

**Date:** 2026-10-22

### What works

#### Backend
- **Review Creation (`POST /api/reviews`)**:
  - Requires `authRequired` authentication.
  - Enforces strict business & integrity constraints:
    - Booking must be in `CONFIRMED` status.
    - Caller must own the booking (`booking.user_id === req.user.user_id`).
    - The safari slot must have occurred in the past (`TIMESTAMP(slot_date, slot_time) <= NOW()`). Future slots reject with `400 Bad Request` ("Cannot review a slot that has not yet occurred").
    - Enforces 1:1 uniqueness per booking (`booking_id UNIQUE`); duplicate attempts reject with `400 Bad Request`.
    - Rating must be integer between 1 and 5.
    - Sanitizes and stores comment (up to 1000 characters).
- **Sanctuary Ratings Summary (`GET /api/sanctuaries/:id`)**:
  - Augmented detail response with live `ratings_summary`:
    - `average_rating`: computed average rounded to 1 decimal place.
    - `total_reviews`: total verified reviews count.
    - `counts`: breakdown per star rating (5, 4, 3, 2, 1) to power distribution bars.
- **Paged Sanctuary Reviews (`GET /api/sanctuaries/:id/reviews?page=&limit=`)**:
  - Public endpoint returning paged review cards with reviewer names, avatars/profile images, star ratings, comments, and created timestamps.
- **Booking Review Context (`GET /api/reviews/booking/:bookingId`)**:
  - Protected endpoint returning sanctuary cover photo, title, location, activity name, visit date, and existing review data (if any) to pre-fill the review screen.

#### Frontend Pages
- **Page 12: Write a Review (`frontend/src/pages/user/WriteReview.jsx`)**:
  - Matches reference Image 12 under `theme-user`.
  - Left column: Sanctuary preview card showing cover photo, title, location pin, activity name, visit date, and booking code.
  - Right column:
    - Interactive 5-star rating selector with hover preview and dynamic descriptive labels (e.g. "5 Stars — Exceptional & unforgettable!").
    - "Share your experience" textarea with real-time character counter (`0/1000`).
    - Explicitly omits photo upload per version 1 project specifications.
    - "Submit Review" button (`#D9A441`) with loading spinner and error handling.
    - Handles pre-existing review by displaying a read-only verified summary with a return button.
- **Page 05: Sanctuary Detail Reviews Block (`frontend/src/pages/user/SanctuaryDetail.jsx`)**:
  - Matches reference Image 05 reviews section.
  - Displays live average score (e.g. `4.8`) and star icon cluster.
  - Dynamic 5-to-1 percentage distribution bars calculated live from `ratings_summary.counts`.
  - Verified review cards showing reviewer name, avatar initial/image, star rating, visit date, and review quote.
- **Routing & Integration**:
  - Connected "⭐ Write a review" button on **My Bookings** (Page 10, Past tab) linking directly to `/review/:bookingId`.
  - Wired `/review/:bookingId` in [`frontend/src/App.jsx`](file:///c:/WILDBOOK/frontend/src/App.jsx) wrapped in `ProtectedRoute`.

---

### How to run and test

#### 1. Automated Test Suite (18/18 Passed Cleanly)
Run the test suite from `backend/`:
```powershell
cd c:\WILDBOOK\backend
node test_phase10.js
```
Expected output: `SUMMARY: 18 Passed, 0 Failed`

#### 2. Running Live in the Browser
- **Step 1 — Write a Review (Page 12):**
  - Log in as visitor (`visitor@wildbook.com` / `Visitor@123`).
  - Navigate to [http://localhost:5173/my-bookings](http://localhost:5173/my-bookings) and click the **Past** tab.
  - Click **Write a review** on any completed past booking card (or visit [http://localhost:5173/review/1](http://localhost:5173/review/1)).
  - Observe the sanctuary details card on the left.
  - Hover and click on stars (1 to 5) to set your rating.
  - Enter review comment; observe character counter (`X / 1000`).
  - Note: no photo upload input is shown per version 1 specifications.
  - Click **Submit Review** $\to$ successfully submits and redirects to My Bookings.
- **Step 2 — View Reviews on Sanctuary Detail (Page 05):**
  - Navigate to [http://localhost:5173/sanctuaries/1](http://localhost:5173/sanctuaries/1).
  - Scroll down to the **Guest Reviews** section.
  - Observe the live average score, the 5-to-1 percentage bars, and the review cards displaying verified reviews.

---

## Phase 11: Bookings and dashboards ✅ COMPLETE

**Date:** 2026-10-22

### What works

#### Backend
- **Admin Bookings List (`GET /api/admin/bookings`)**:
  - Requires role `ADMIN` and approved status.
  - Scoped strictly to the sanctuaries owned by the authenticated admin (`sanctuaries.admin_id = req.user.user_id`).
  - Filters by date range (`from` / `date_from`, `to` / `date_to`), activity (`activity_id`), status (`CONFIRMED`, `PENDING`, `CANCELLED`, `EXPIRED`), and text search (`booking_code`, `visitor_name`, `visitor_email`, `activity_name`).
  - Supports pagination (`page`, `limit`), returning records and metadata.
- **Admin Booking Details & Masked Attendees (`GET /api/admin/bookings/:id`)**:
  - Verifies admin ownership.
  - Fetches complete booking metadata, visitor details, slot info, guide/vehicle assignments, payment status, and cancellation fee breakdown.
  - Retrieves all attendees with ID numbers strictly masked to the last 4 characters only (`****1234`) for security compliance.
- **Admin Bookings CSV Export (`GET /api/admin/bookings/export`)**:
  - Exports filtered bookings as a CSV file with proper `Content-Type: text/csv` and `Content-Disposition: attachment; filename="bookings-export.csv"`.
- **Admin Dashboard Stats (`GET /api/admin/stats`)**:
  - Scoped to admin's sanctuaries:
    - `total_bookings`: count of bookings.
    - `revenue_net`: net revenue calculated as confirmed bookings total plus 40% retained cancellation fees (`SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total_amount WHEN b.status = 'CANCELLED' THEN COALESCE(c.fee_amount, 0) ELSE 0 END)`).
    - `upcoming_slots`: count of future active slots.
    - `average_rating` & `review_count`: average star rating from verified visitor reviews.
    - `bookings_trend`: daily booking breakdown over past 30 days for trend line chart.
    - `revenue_by_activity`: cumulative net revenue per activity for bar chart.
    - `recent_bookings`: 5 most recent reservations with status and visitor details.
- **Admin Reports (`GET /api/admin/reports`)**:
  - Scoped SQL reports: slot occupancy with subqueries, monthly net revenue, and activity cancellation rates.
- **Authority Owner Dashboard Stats (`GET /api/owner/stats`)**:
  - Scoped to `SITE_OWNER`:
    - `pending_admins`: count of pending operator applications.
    - `pending_sanctuaries`: count of pending sanctuary submissions.
    - `approved_sanctuaries`: count of active approved sanctuaries.
    - `total_bookings`: total platform reservations.
    - `bookings_per_sanctuary`: booking counts per sanctuary for bar chart.
    - `approvals_over_time`: monthly approval counts for the last 6 months for line chart.
    - `latest_pending_requests`: "Needs Your Attention" feed merging pending admins and pending sanctuaries, ordered by submission date, with direct review URLs.
- **Owner Platform Reports (`GET /api/owner/reports`)**:
  - 5 SQL reports satisfying all academic and viva criteria:
    1. **Most-Booked Sanctuaries**: ranks sanctuaries by booking count, visitor footfall, and gross receipts.
    2. **Frequent Bookers** (MANDATORY: `GROUP BY ... HAVING`): groups by user and filters `HAVING COUNT(b.booking_id) >= 1`, tracking seats and total spend.
    3. **Monthly Revenue per Sanctuary**: monthly breakdown including 40% cancellation fees kept.
    4. **Slot Occupancy Rate** (MANDATORY: Correlated Subquery): calculates booked seats via `(SELECT COALESCE(SUM(b.number_of_people), 0) FROM bookings b WHERE b.slot_id = sl.slot_id AND b.status = 'CONFIRMED')` against vehicle capacity.
    5. **Cancellation Rates by Sanctuary**: total reservations, confirmed count, cancelled count, cancellation rate %, and fees retained.

#### Frontend Pages
- **Page 20: Admin Bookings (`frontend/src/pages/admin/Bookings.jsx`)**:
  - Matches reference Image 20 under `theme-admin`.
  - Filter bar: date range (`from` & `to`), activity dropdown, status dropdown, search input, and Export CSV button.
  - Table: Booking ID, Visitor Name & email, Activity with icon, Date & Time, People count, Amount in Indian Rupees (`₹`), Status badge, and View action button.
  - Pagination controls: "Showing X to Y of Z bookings", page buttons with active state.
  - Attendee Slide-over Drawer:
    - Booking code, status badge, activity, schedule, and amount summary.
    - Attendee cards displaying Name, Age, ID type, and masked ID number (`****1234`).
    - "Download Attendee List" / Print manifest action.
- **Page 16: Admin Dashboard (`frontend/src/pages/admin/Dashboard.jsx`)**:
  - Matches reference Image 16 under `theme-admin`.
  - 4 Stat cards: Total bookings, Revenue (in `₹` net of refunds), Upcoming slots, Average rating (with star).
  - Chart.js Line Chart: "Bookings this month" with smooth green gradient area fill (`#2D5A3D`).
  - Chart.js Bar Chart: "Revenue by activity" with warm amber bars (`#D9A441`).
  - Recent bookings table with user avatar initial, activity icon, date, status badge, and "View all bookings >" link.
- **Page 22: Owner Dashboard (`frontend/src/pages/owner/Dashboard.jsx`)**:
  - Matches reference Image 22 under `theme-owner`.
  - Greeting header: "Welcome, Authority Owner".
  - 4 Stat cards: Pending Admins, Pending Sanctuaries, Approved Sanctuaries, Total Bookings (cards link directly to clearance queues).
  - Chart.js Bar Chart: "Bookings per Sanctuary" with dark forest green bars (`#162B1D`).
  - Chart.js Line Chart: "Approvals Over Time" with markers across 6 months.
  - "Needs Your Attention" table: Type badge (`Admin Request` / `Sanctuary Request`), Name, Submitted By, Date Submitted, Details, Status badge, and "Review" button linking to `/owner/admin-requests` or `/owner/sanctuary-requests/:id`.
- **Admin Reports (`frontend/src/pages/admin/Reports.jsx`)**:
  - Tabbed interface: Slot Occupancy Rates (with visual progress bars), Monthly Net Revenue, and Cancellation Rates.
- **Owner Reports (`frontend/src/pages/owner/Reports.jsx`)**:
  - Tabbed interface displaying all 5 SQL reports: Most-Booked Sanctuaries, Frequent Bookers (`GROUP BY ... HAVING`), Monthly Revenue & Retention, Slot Occupancy Rates (subquery), and Cancellation Rates.
- **Theme & Currency Compliance**:
  - Indian Rupee symbol (`₹`) used consistently everywhere, never dollars.
  - Portal identity strictly maintained via `theme-admin` and `theme-owner`.

---

### How to run and test

#### 1. Automated Test Suite (7/7 Passed Cleanly)
Run the test suite from `backend/`:
```powershell
cd c:\WILDBOOK\backend
node test_phase11.js
```
Expected output:
```
--- Testing Phase 11 Backend Endpoints ---
✓ Admin login successful
✓ Owner login successful
--- 1. Testing GET /api/admin/stats --- Status: 200
--- 2. Testing GET /api/admin/bookings --- Status: 200
--- 3. Testing GET /api/admin/bookings/:id --- Status: 200 (Masked: ****5566)
--- 4. Testing GET /api/admin/bookings/export --- Status: 200 (text/csv)
--- 5. Testing GET /api/admin/reports --- Status: 200
--- 6. Testing GET /api/owner/stats --- Status: 200
--- 7. Testing GET /api/owner/reports --- Status: 200
🎉 ALL PHASE 11 BACKEND TESTS PASSED SUCCESSFULLY! 🎉
```

#### 2. Running Live in the Browser
- **Step 1 — Admin Dashboard & Bookings (Pages 16 & 20):**
  - Sign in as Admin (`admin.nagarhole@wildbook.com` / `Admin@123`) at [http://localhost:5173/admin/login](http://localhost:5173/admin/login).
  - Land on `/admin`: verify 4 stat cards (in `₹`), "Bookings this month" line chart, "Revenue by activity" bar chart, and recent bookings table.
  - Click **Bookings** in sidebar (or visit [http://localhost:5173/admin/bookings](http://localhost:5173/admin/bookings)):
    - Filter by Activity or Status.
    - Click **Export** $\to$ downloads `wildbook-bookings-YYYY-MM-DD.csv`.
    - Click **View** on any row $\to$ attendee drawer slides open showing masked ID numbers (`****5566`).
    - Click **Download Attendee List** $\to$ opens printable attendee manifest.
  - Click **Reports** in sidebar (or visit [http://localhost:5173/admin/reports](http://localhost:5173/admin/reports)):
    - Inspect Slot Occupancy Rates, Monthly Net Revenue, and Cancellation Rates tabs.
- **Step 2 — Owner Dashboard & Platform Reports (Page 22):**
  - Sign in as Site Owner (`owner@wildbook.com` / `Owner@123`) at [http://localhost:5173/owner/login](http://localhost:5173/owner/login).
  - Land on `/owner`: verify 4 stat cards, "Bookings per Sanctuary" bar chart, "Approvals Over Time" line chart, and "Needs Your Attention" table.
  - Click **Review** on any pending request $\to$ deep links to review page.
  - Click **Reports** in sidebar (or visit [http://localhost:5173/owner/reports](http://localhost:5173/owner/reports)):
    - View Most-Booked Sanctuaries, Frequent Bookers (`GROUP BY ... HAVING`), Monthly Revenue with cancellation fees kept, Slot Occupancy (subquery), and Cancellation Rates.

---

## Phase 12: Polish, Security, Final Testing and Documentation ✅ COMPLETE

**Date:** 2026-10-22

### What works

#### 1. Page 25: 404 Not Found (`NotFound.jsx`)
- Matches reference Image 25 under `theme-user` using shared `<Navbar />` and `<Footer />`.
- Giant serif `404` header (`text-7xl md:text-9xl`) in dark forest green (`#1F3D2B`).
- Botanical leaf accent line and headline: *"This trail leads nowhere"*.
- Subtitle: *"The page you're looking for seems to have wandered off into the wild. Let's get you back on track."*
- Amber button: `→ Back to home` linking to `/`.
- High-resolution photographic wildlife illustration of a wild red fox cub on a mossy forest path (`/fox-404.jpg`).
- Subtle botanical fern watermark in the background.

#### 2. Security Audit & Hardening (Phase 12 Checklist)
- **Bcrypt Password Security:** Passwords hashed with bcrypt (`salt rounds = 10`); `password_hash` is never exposed or returned in any API responses.
- **Strict Parameterized Queries:** 100% of MySQL queries use prepared statements with placeholder substitution (`?`), eliminating SQL injection vulnerabilities.
- **Server-Side Authorization & Ownership Enforcement:** Protected endpoints assert authentication (`authRequired`), role validation (`requireRole`), approved operator standing (`requireApprovedAdmin`), and resource ownership (`admin_id = req.user.user_id` or `b.user_id = req.user.user_id`).
- **Private Operator Document Storage:** Verification documents in `backend/uploads/admin-docs/` are strictly non-static and served only to `SITE_OWNER` via authenticated streaming endpoints.
- **Image Upload Allow-List:** Multi-part file uploads capped at 2MB and restricted to JPEG, PNG, and WebP.
- **Brute Force Rate Limiting:** Express rate limiting active on all authentication endpoints.
- **Git Ignore Security:** Root `.gitignore` and `backend/.gitignore` strictly ignore `.env`, `.env.local`, `node_modules/`, and `uploads/admin-docs/*`.
- **Portal Identity Verification:** The `<Logo />` component is the single authority for logo rendering across all three portals (`user`, `admin`, `owner`).

#### 3. Automated Specification Test Suite (T1 to T16)
- Created `backend/test_t1_t16.js` executing tests against live Express and MySQL instances.
- **Result:** **16/16 Passed (100% Success Rate)**.
- Documented in [`docs/test-results.md`](file:///c:/WILDBOOK/docs/test-results.md).

#### 4. Project Documentation & Setup Guide
- Generated root [`README.md`](file:///c:/WILDBOOK/README.md) containing:
  - System architecture & portal identity table
  - Default seed credentials for all four accounts
  - Step-by-step installation instructions (MySQL, Backend, Frontend)
  - 10-step Viva / Demonstration walkthrough script
  - Automated test execution commands

---

### How to run and test

#### 1. Automated Test Suite (16/16 Passed)
```powershell
cd c:\WILDBOOK\backend
node test_t1_t16.js
```
Expected output:
```
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

#### 2. In Browser
- Navigate to an arbitrary non-existent route, e.g. [http://localhost:5173/unknown-path](http://localhost:5173/unknown-path).
- Verify Page 25 404 renders with shared Navbar, serif "404", "This trail leads nowhere", the fox photography, and "Back to home" button leading to `/`.
- Verify shared Footer displays correctly.

---

## Phase 13: Portal Navigation & Authentication Flow Connection ✅ COMPLETE

**Date:** 2026-10-22

### What was connected
1. **Landing Page Navigation (Visitor Navbar, Logged-Out)**:
   - Replaced single "Log in" and "Sign up" with two accessible dropdowns.
   - **Log in dropdown**: Visitor login (`/login`), Sanctuary admin login (`/admin/login`), Authority login (`/owner/login`).
   - **Sign up dropdown**: Visitor signup (`/signup`), Register your sanctuary (`/admin/signup`). No owner signup.
   - Maintained amber button style for Sign up. Dropdowns support keyboard Escape dismissal and click-outside dismissal.
2. **Landing Page Section "Choose how you want to continue"**:
   - Added interactive gateway section immediately following featured sanctuaries on Home.
   - Two cards: "I'm a traveller" (Log in, Sign up) and "I run a sanctuary" (Admin login, Register your sanctuary).
   - Slim quiet line underneath: "Government authority? Authority login" linking to `/owner/login`.
   - Added same three portal links to a new "Portals" column in the shared `Footer`.
3. **Navbar when Logged In**:
   - Visitor: Replaced Log in/Sign up with "My Bookings" and avatar menu (My Bookings, Log out).
   - Sanctuary Admin / Authority Owner viewing visitor site: displays "Go to dashboard" (`/admin` or `/owner`) and "Log out". Never displays Log in or Sign up to authenticated users.
4. **Redirect Rules After Authentication**:
   - Visitor login & signup: respects `?redirect=` query param, defaulting to `/`.
   - Logged-out visitor clicking Book or Continue to booking sends them to `/login?redirect=<current path>`.
   - Admin login: `APPROVED` $\to$ `/admin`, `PENDING` $\to$ `/admin/pending`, `REJECTED`/`SUSPENDED` remains on login page showing authority note.
   - Admin signup $\to$ `/admin/pending`.
   - Owner login $\to$ `/owner`.
   - Logout clears token and redirects to portal's own login (`/`, `/admin/login`, `/owner/login`).
5. **Guards & Session Restoration**:
   - `ProtectedRoute` verifies user role. Logged-in users attempting to access foreign portals are redirected to their own home with a flash message banner.
   - `GuestRoute` redirects authenticated users away from login/signup pages to their own portal dashboard.
   - Page refresh restores session via `GET /api/auth/me` before rendering protected routes.
   - Wrong-role login forms display: "This is a sanctuary admin account. Use Admin login" / "This is a visitor account. Use Visitor login" / "This is a site authority account. Use Authority login" with direct clickable switch links.
6. **Navbar Links & Informational Pages**:
   - Sanctuaries links to `/sanctuaries`.
   - Experiences scrolls down to `#experiences` on Home (or navigates to `/#experiences` from other pages); experience cards link to `/sanctuaries?activity=<type>`.
   - Created `/about` and `/conservation` pages matching the visitor aesthetic.
   - Active navbar links highlighted in amber.








