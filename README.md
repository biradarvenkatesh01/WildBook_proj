# WildBook 🌿

> **Wildlife Sanctuary & Safari Reservation Management System**  
> Built with MySQL 8.0 (InnoDB), Node.js / Express, and React 19 + Tailwind CSS v4.

---

## 1. Overview & Portal Identity

WildBook is a full-stack safari reservation and wildlife reserve management platform built with strict three-tier role separation. Each portal maintains its own visual identity, authentication boundary, and color palette via dedicated CSS theme tokens and the shared `<Logo />` component:

| Portal | Audience | Route | Theme | Core Powers |
|---|---|---|---|---|
| **Visitor Portal** | General Public | `/` | `theme-user` | Browse sanctuaries, view live seat availability, book with 10-minute hold, mock payments, download PDF permit with QR code, cancel with 40% fee, submit verified reviews. |
| **Admin Portal** | Sanctuary Operators | `/admin` | `theme-admin` | Manage sanctuary details & gallery, create activities, slots, assign guides & vehicles, track bookings with masked attendee IDs (`****1234`), CSV exports, operational stats & charts. |
| **Site Owner Portal** | Government Authority | `/owner` | `theme-owner` | Review operator licenses & credentials, approve/reject sanctuary listings, monitor platform-wide analytics, and view cross-sanctuary SQL reports. |

---

## 2. Default Seed Credentials

All passwords use strong bcrypt hashes (`salt rounds = 10`):

| Role | Email | Password | Status / Access |
|---|---|---|---|
| **Site Owner** | `owner@wildbook.com` | `Owner@123` | Active Authority Administrator |
| **Sanctuary Admin (Approved)** | `admin.nagarhole@wildbook.com` | `Admin@123` | Approved Operator (Nagarhole National Park) |
| **Sanctuary Admin (Pending)** | `admin.bandipur@wildbook.com` | `Admin@123` | Pending Clearance (Bandipur Tiger Reserve) |
| **Visitor** | `visitor@wildbook.com` | `Visitor@123` | Verified Public Customer |

---

## 3. Getting Started & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MySQL Server** (v8.0.x with InnoDB storage engine enabled)

### Step 1: Database Setup
Log in to MySQL and initialize the database schema, stored procedures, triggers, views, and seed data:

```bash
# In MySQL shell or terminal:
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_triggers.sql
mysql -u root -p < database/03_procedures.sql
mysql -u root -p < database/04_views.sql
mysql -u root -p < database/05_seed.sql
```

### Step 2: Backend Configuration & Startup
```bash
cd backend
# Create .env from template (or ensure DB credentials match):
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_NAME=wildbook
# DB_PORT=3306
# PORT=5000
# JWT_SECRET=wildbook_super_secret_jwt_key_2026

npm install
node server.js
```
The backend API starts at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### Step 3: Frontend Setup & Startup
```bash
cd ../frontend
npm install
npm run dev
```
The frontend dev server runs at `http://localhost:5173`.

---

## 4. Automated Testing & Verification

### Run Specification Test Suite (T1 to T16)
```bash
cd backend
node test_t1_t16.js
```
All 16 specification tests run against live database instances with 100% pass rate:
- **T1:** Pending admin login blocked with clear message
- **T2:** Visitor token rejected with `403 Forbidden` on admin/owner endpoints
- **T3:** Cross-admin sanctuary tampering blocked with `403 Forbidden`
- **T4:** Unapproved draft sanctuaries return `404 Not Found` to the public
- **T5:** Incomplete sanctuary submissions rejected
- **T6:** Approved sanctuaries appear immediately in the public listing
- **T7:** Overbooking capacity rejected atomically
- **T8:** Two concurrent race requests for the last seats: exactly one succeeds via `SELECT ... FOR UPDATE`
- **T9:** Payments attempted after the 10-minute hold expires are rejected
- **T10:** Cancellations apply exact 40% retention fee and 60% refund
- **T11:** Double cancellation attempts are rejected
- **T12:** Reviews without completed past bookings are rejected
- **T13:** Duplicate email registration is rejected
- **T14:** Double allocation of guides at the same time is rejected by unique trigger
- **T15:** Attendee count mismatch rolls back the entire reservation transaction
- **T16:** Admin verification documents blocked with `403` when requested by non-owners

Full results and rationale are archived in [`docs/test-results.md`](file:///c:/WILDBOOK/docs/test-results.md).

### Run Phase 11 Dashboard & Reports Test
```bash
node test_phase11.js
```

---

## 5. Viva / Demo Walkthrough Script

1. **Admin Application:** Sign up as a new operator at `/admin/signup`, upload mock license/identity documents, and observe the pending clearance screen (`/admin/pending`).
2. **Authority Clearance:** Log in as Site Owner (`/owner/login`), inspect the pending operator documents via secure streaming, and approve the admin application.
3. **Sanctuary & Slot Creation:** Log in as the approved admin (`/admin/login`), create a sanctuary draft, upload gallery photos, set cover photo, configure safari activities, vehicles, guides, and schedule daily slots. Submit for authority review.
4. **Sanctuary Authorization:** As Site Owner, review the listing submission at `/owner/sanctuary-requests` and grant approval.
5. **Visitor Discovery & Hold:** As a visitor (`/login`), browse approved reserves, select an available safari slot, enter attendee details, and observe the atomic 10-minute temporary seat hold countdown.
6. **Payment & Permit Generation:** Complete mock payment (UPI/Card/NetBanking), generate confirmed booking code (`WB-XXXXXX`), and download the in-memory PDF ticket with QR code verification.
7. **Concurrency & Overbooking Block:** Run concurrent reservation attempts to demonstrate `SELECT ... FOR UPDATE` row-level serialization preventing overselling.
8. **Cancellation & 40/60 Split:** In visitor's `/my-bookings` portal, cancel a confirmed booking: verify the 40% fee deduction and 60% refund breakdown, and see the freed slot capacity instantly return to availability.
9. **Verified Reviews:** Submit a 5-star review for a past completed visit and see live sanctuary ratings update dynamically.
10. **Analytics & Dashboards:** Review the Chart.js visual dashboards on `/admin` and `/owner`, and run SQL reports demonstrating correlated subqueries and `GROUP BY ... HAVING`.

---

## 6. Architecture & Security Compliance

- **Storage Engine:** MySQL 8.0 InnoDB with foreign key referential integrity.
- **Passwords:** Bcrypt hashing with salt rounds = 10; `password_hash` is never returned in any response.
- **Parameterized SQL:** All queries are parameterized (`?`) to prevent SQL injection.
- **Document Protection:** Operator verification documents stored privately in `uploads/admin-docs/` (non-static) and served strictly through authenticated owner-only controllers.
- **Currency Standard:** Indian Rupees (`₹`) formatted consistently across all booking, payment, and analytical views.
- **Single Source of Truth:** All brand logos across all three portals are exclusively managed through the shared `<Logo />` component.

---

## License
MIT License — WildBook Project 2026.
