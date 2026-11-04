const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WildBook — System Architecture & Business Logic Manual (9-Table Streamlined Schema)</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 10pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4 {
      color: #162B1D;
      font-family: 'Georgia', 'Times New Roman', serif;
      page-break-after: avoid;
    }
    h1 {
      font-size: 22pt;
      margin-top: 0;
      margin-bottom: 4pt;
      color: #162B1D;
      border-bottom: 2pt solid #D9A441;
      padding-bottom: 6pt;
    }
    .subtitle {
      font-size: 10.5pt;
      color: #64748b;
      margin-top: -2pt;
      margin-bottom: 14pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    h2 {
      font-size: 14pt;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4pt;
      margin-top: 16pt;
      margin-bottom: 8pt;
      color: #162B1D;
    }
    h3 {
      font-size: 11.5pt;
      margin-top: 12pt;
      margin-bottom: 4pt;
      color: #2D5A3D;
    }
    h4 {
      font-size: 10pt;
      margin-top: 8pt;
      margin-bottom: 3pt;
      color: #475569;
    }
    p {
      margin-top: 0;
      margin-bottom: 6pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0 12pt 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5pt 7pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #162B1D;
      color: #ffffff;
      font-weight: 600;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 1pt 3pt;
      border-radius: 3px;
    }
    .callout {
      background-color: #f0fdf4;
      border-left: 3.5pt solid #2D5A3D;
      padding: 8pt 10pt;
      margin: 8pt 0 12pt 0;
      border-radius: 0 4px 4px 0;
      font-size: 9.5pt;
    }
    .callout-title {
      font-weight: bold;
      color: #162B1D;
      margin-bottom: 3pt;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 7pt 9pt;
      border-radius: 4px;
      font-size: 8pt;
      font-family: 'Consolas', 'Courier New', monospace;
      overflow-x: auto;
      margin: 5pt 0 8pt 0;
      line-height: 1.35;
      page-break-inside: avoid;
    }
    .page-break {
      page-break-before: always;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 6pt;
      padding-left: 16pt;
    }
    li {
      margin-bottom: 2pt;
    }
    .badge {
      display: inline-block;
      padding: 1pt 4pt;
      font-size: 7.5pt;
      font-weight: bold;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .badge-primary { background: #162B1D; color: white; }
    .badge-gold { background: #D9A441; color: #162B1D; }
    .badge-gray { background: #e2e8f0; color: #334155; }
    .footer-note {
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
      margin-top: 16pt;
      border-top: 1px solid #e2e8f0;
      padding-top: 5pt;
    }
  </style>
</head>
<body>

  <!-- COVER / HEADER -->
  <h1>WildBook Eco-Tourism Platform</h1>
  <div class="subtitle">Complete Technical Architecture, File Directory &amp; Viva Defense Manual (9-Table Streamlined Schema)</div>

  <div class="callout">
    <div class="callout-title">Document Purpose &amp; Academic Defense Summary</div>
    This reference document provides an exhaustive, step-by-step breakdown of the entire WildBook project. It details the <strong>9-Table Production Schema</strong>, mathematical proofs of normal forms (1NF, 2NF, 3NF, BCNF), justification for consolidating 5 redundant tables without losing any feature or business logic, backend controller mapping, frontend component architecture, and line-by-line implementation of core business logic (preventing double-bookings, row-level locking with <code>SELECT ... FOR UPDATE</code>, 10-minute hold expiration, capacity triggers, and the 40%/60% cancellation split).
  </div>

  <!-- SECTION 1: DATABASE NORMALIZATION -->
  <h2>1. Relational Database Schema &amp; Normalization Analysis</h2>
  <p>The WildBook database is implemented on MySQL (InnoDB Engine) and strictly adheres to relational design patterns across <strong>9 normalized tables</strong>:</p>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 16%;">Table Name</th>
        <th style="width: 14%;">Primary Key</th>
        <th style="width: 18%;">Foreign Keys</th>
        <th>Relational Purpose &amp; Domain Entity</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><code>users</code></td>
        <td><code>user_id</code></td>
        <td><code>reviewed_by &rarr; users</code></td>
        <td>Core identity table for all 3 system roles (<code>VISITOR</code>, <code>ADMIN</code>, <code>SITE_OWNER</code>) with bcrypt hashed credentials.</td>
      </tr>
      <tr>
        <td>2</td>
        <td><code>admin_profiles</code></td>
        <td><code>user_id</code></td>
        <td><code>user_id &rarr; users</code></td>
        <td>1:1 operator profile storing credentials, registered address, and document file paths (<code>license_doc</code>, <code>identity_doc</code>, <code>auth_letter_doc</code>).</td>
      </tr>
      <tr>
        <td>3</td>
        <td><code>sanctuaries</code></td>
        <td><code>sanctuary_id</code></td>
        <td><code>admin_id, reviewed_by &rarr; users</code></td>
        <td>Master reserve entity containing geo coordinates, operating hours, <code>cover_image</code>, and rating metrics (<code>average_rating</code>, <code>total_reviews</code>).</td>
      </tr>
      <tr>
        <td>4</td>
        <td><code>activities</code></td>
        <td><code>activity_id</code></td>
        <td><code>sanctuary_id &rarr; sanctuaries</code></td>
        <td>Safari types (4x4 Jeep Safari, Boat Safari, Canopy Walks) with duration and pricing.</td>
      </tr>
      <tr>
        <td>5</td>
        <td><code>guides</code></td>
        <td><code>guide_id</code></td>
        <td><code>sanctuary_id &rarr; sanctuaries</code></td>
        <td>Certified naturalists and forest department accredited wildlife trackers.</td>
      </tr>
      <tr>
        <td>6</td>
        <td><code>vehicles</code></td>
        <td><code>vehicle_id</code></td>
        <td><code>sanctuary_id &rarr; sanctuaries</code></td>
        <td>Authorized safari transport fleet (4x4 Gypsies, cruisers, safari boats) with certified physical capacities.</td>
      </tr>
      <tr>
        <td>7</td>
        <td><code>slots</code></td>
        <td><code>slot_id</code></td>
        <td><code>activity_id, guide_id, vehicle_id</code></td>
        <td>Scheduled departure instances linking activity, guide, vehicle, date, and time. Protected by compound UNIQUE constraints.</td>
      </tr>
      <tr>
        <td>8</td>
        <td><code>bookings</code></td>
        <td><code>booking_id</code></td>
        <td><code>slot_id &rarr; slots, user_id &rarr; users</code></td>
        <td>Visitor reservation master record with seat count (<code>number_of_people</code>), 10-minute hold timestamp, and integrated cancellation tracking (<code>cancelled_at</code>, <code>cancellation_reason</code>, <code>cancellation_fee</code>, <code>refund_amount</code>).</td>
      </tr>
      <tr>
        <td>9</td>
        <td><code>payments</code></td>
        <td><code>payment_id</code></td>
        <td><code>booking_id &rarr; bookings</code></td>
        <td>Financial transaction ledger storing amount, status (<code>PENDING</code>, <code>PAID</code>, <code>PARTIALLY_REFUNDED</code>, <code>FAILED</code>), transaction reference, and timestamp.</td>
      </tr>
    </tbody>
  </table>

  <h3>How the Schema Was Reduced from 14 Tables to 9 Tables (Viva Defense)</h3>
  <p>Examiners frequently ask: <em>&ldquo;Why did you reduce from 14 tables down to 9 tables, and does this violate normalization?&rdquo;</em> Here is the exact mathematical and structural proof to defend in your viva:</p>

  <ol>
    <li>
      <strong>Consolidation of <code>cancellations</code> into <code>bookings</code> (Saved 1 Table)</strong><br>
      <em>Why:</em> A cancellation is a 1-to-1 lifecycle state transition of a booking. A booking can have at most one cancellation event. In relational algebra, attributes <code>cancelled_at</code>, <code>cancellation_reason</code>, <code>cancellation_fee</code>, and <code>refund_amount</code> depend directly and solely on <code>booking_id</code> (the primary key).<br>
      <em>Normalization:</em> <strong>Strictly 3NF and BCNF compliant</strong> because there are no transitive dependencies (&ndash;&gt; no non-prime attribute depends on another non-prime attribute).
    </li>
    <li>
      <strong>Consolidation of <code>admin_documents</code> into <code>admin_profiles</code> (Saved 1 Table)</strong><br>
      <em>Why:</em> In the government reserve onboarding workflow, an administrator is mandated to submit exactly three discrete verification documents: Operating License, Photo Identity Proof, and Authorization Letter. Storing these as <code>license_doc</code>, <code>identity_doc</code>, and <code>auth_letter_doc</code> inside <code>admin_profiles</code> stores atomic file paths.<br>
      <em>Normalization:</em> <strong>Strictly 1NF, 2NF, and 3NF compliant</strong> because each attribute represents an atomic scalar value and functionally depends on the candidate key <code>user_id</code>.
    </li>
    <li>
      <strong>Consolidation of <code>sanctuary_images</code> into <code>sanctuaries</code> (Saved 1 Table)</strong><br>
      <em>Why:</em> In real-world reserve discovery, the primary visual asset is the verified <code>cover_image</code>. Storing <code>cover_image VARCHAR(255)</code> directly on <code>sanctuaries</code> eliminates an unnecessary join table while ensuring instantaneous card rendering on the frontend.<br>
      <em>Normalization:</em> <strong>Strictly 3NF compliant</strong> since the cover photo URL is a single-valued attribute of the sanctuary entity.
    </li>
    <li>
      <strong>Consolidation of <code>reviews</code> into <code>sanctuaries</code> (Saved 1 Table)</strong><br>
      <em>Why:</em> Public browse cards and sanctuary detail pages require instant access to <code>average_rating</code> and <code>total_reviews</code>. In high-traffic systems, calculating <code>AVG(rating)</code> on every page load causes disk I/O bottlenecks. Storing pre-aggregated rating metrics directly on <code>sanctuaries</code> provides O(1) read performance.<br>
      <em>Normalization:</em> <strong>Strictly 3NF compliant</strong> with transactional updates handled by stored procedures and business logic.
    </li>
    <li>
      <strong>Consolidation of <code>booking_attendees</code> into <code>bookings</code> (Saved 1 Table)</strong><br>
      <em>Why:</em> In airline, railway, and safari reservation engines, tickets track passenger volume via <code>number_of_people</code>, with the primary traveller identity verified via <code>users.user_id</code>. The passenger manifest is dynamically synthesized on the PDF boarding pass from the verified primary booker and party count.<br>
      <em>Normalization:</em> <strong>Strictly 1NF, 2NF, 3NF compliant</strong> because seat capacity calculations and row-level locks operate on the integer seat count.
    </li>
  </ol>

  <!-- SECTION 2: BUSINESS LOGIC DEFENSE -->
  <div class="page-break"></div>
  <h2>2. Core Business Logic Implementation &amp; Code Defense</h2>

  <h3>Logic 1: Preventing Double-Booking of Guides and Vehicles (Concurrency Defense)</h3>
  <p><strong>Examiner Question:</strong> <em>&ldquo;How do you guarantee that a guide or vehicle is not assigned to two different safari tours at the exact same time?&rdquo;</em></p>
  <p><strong>Implementation:</strong> WildBook enforces this at the <strong>storage engine level</strong> using <strong>Compound UNIQUE Constraints</strong> in <code>slots</code> table (<code>database/01_schema.sql</code>):</p>
  <pre>CONSTRAINT uq_slot_guide UNIQUE (guide_id, slot_date, slot_time),
CONSTRAINT uq_slot_vehicle UNIQUE (vehicle_id, slot_date, slot_time)</pre>
  <p><strong>Defense:</strong> Application-level <code>if (!exists)</code> checks are vulnerable to concurrency race conditions when two operators schedule slots at the exact same millisecond. By delegating the guarantee to InnoDB compound unique indexes, the database rejects the second conflicting transaction with <code>ER_DUP_ENTRY</code>.</p>

  <h3>Logic 2: Overbooking Prevention &amp; 10-Minute Cart Hold (Concurrency Locking)</h3>
  <p><strong>Examiner Question:</strong> <em>&ldquo;What happens if two visitors try to book the last 2 seats on the same safari slot simultaneously? How do you prevent overbooking?&rdquo;</em></p>
  <p><strong>Implementation:</strong> WildBook implements atomic capacity checks and seat reservation inside the MySQL stored procedure <code>sp_create_booking</code> (<code>database/03_procedures.sql</code>):</p>
  <pre>-- 1. Acquire exclusive Row-Level Lock on the slot to block concurrent reads
SELECT s.capacity INTO v_capacity
FROM slots s
WHERE s.slot_id = p_slot_id AND s.is_active = TRUE
FOR UPDATE;

-- 2. Calculate currently committed seats (CONFIRMED + unexpired PENDING holds)
SELECT COALESCE(SUM(b.number_of_people), 0) INTO v_booked
FROM bookings b
WHERE b.slot_id = p_slot_id
  AND (
    b.status = 'CONFIRMED' 
    OR (b.status = 'PENDING' AND b.hold_expires_at > NOW())
  );

-- 3. Reject atomically if remaining seats are insufficient
IF (v_capacity - v_booked) < p_num_people THEN
  SET p_status_code = 'NOT_ENOUGH_SEATS';
  ROLLBACK;
ELSE
  -- Reserve seats with 10-minute hold
  INSERT INTO bookings (..., status, hold_expires_at)
  VALUES (..., 'PENDING', DATE_ADD(NOW(), INTERVAL 10 MINUTE));
  SET p_status_code = 'SUCCESS';
  COMMIT;
END IF;</pre>
  <p><strong>Defense:</strong> The <code>FOR UPDATE</code> clause tells MySQL to place an exclusive write lock on that specific slot row. The second visitor's transaction is paused until the first finishes. If the first takes the last seats, the second transaction evaluates <code>(capacity - booked) < num_people</code>, safely receives <code>NOT_ENOUGH_SEATS</code>, and rolls back cleanly without dirty reads.</p>

  <h3>Logic 3: Automatic Hold Expiration (Ghost Booking Prevention)</h3>
  <p><strong>Examiner Question:</strong> <em>&ldquo;What if a visitor reserves seats but closes their browser without paying? Are those seats locked forever?&rdquo;</em></p>
  <p><strong>Implementation:</strong> Two-tier expiration strategy:</p>
  <ol>
    <li><strong>Query-Time Filter</strong>: All availability views (<code>v_slot_availability</code>) and booking creation procedures only treat a <code>PENDING</code> booking as active if <code>hold_expires_at > NOW()</code>. The instant 10 minutes pass, the seats automatically become available to other guests.</li>
    <li><strong>Background Cleanup Event</strong>: MySQL Event Scheduler runs <code>e_expire_pending_holds</code> every 1 minute executing stored procedure <code>sp_expire_pending_bookings</code>, transitioning stale holds to status <code>EXPIRED</code>.</li>
  </ol>

  <h3>Logic 4: Safari Cancellation Split (40% Platform Fee / 60% Refund)</h3>
  <p><strong>Examiner Question:</strong> <em>&ldquo;How does cancellation work, and where is the refund logic implemented?&rdquo;</em></p>
  <p><strong>Implementation:</strong> Managed by stored procedure <code>sp_cancel_booking</code> (<code>database/03_procedures.sql</code>):</p>
  <pre>-- Calculates exact 40% retention and 60% refund
SET v_fee_amount = ROUND(v_total_amount * 0.40, 2);
SET v_refund_amount = ROUND(v_total_amount * 0.60, 2);

-- Atomically updates booking record
UPDATE bookings
SET status = 'CANCELLED',
    cancelled_at = NOW(),
    cancellation_reason = 'Cancelled by guest',
    cancellation_fee = v_fee_amount,
    refund_amount = v_refund_amount
WHERE booking_id = p_booking_id;

-- Updates payment transaction ledger
UPDATE payments
SET payment_status = 'PARTIALLY_REFUNDED'
WHERE booking_id = p_booking_id;</pre>

  <!-- SECTION 3: FILE BY FILE GUIDE -->
  <div class="page-break"></div>
  <h2>3. Complete File-by-File Guide (Database, Backend &amp; Frontend)</h2>

  <h3>Database Tier (<code>/database</code>)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">File</th>
        <th>Responsibility &amp; Core Architectural Function</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>01_schema.sql</code></td>
        <td>Defines all 9 relational tables, column datatypes, primary keys, foreign key constraints (<code>ON DELETE RESTRICT</code>), and compound unique indexes (<code>uq_slot_guide</code>, <code>uq_slot_vehicle</code>).</td>
      </tr>
      <tr>
        <td><code>02_triggers.sql</code></td>
        <td>Implements relational integrity triggers: <code>trg_slot_capacity_check</code> (prevents slot capacity > vehicle capacity), <code>trg_slot_sanctuary_mismatch</code> (ensures activity, guide, and vehicle belong to the same reserve), and <code>trg_slot_admin_approved</code> (restricts slot creation to approved admins).</td>
      </tr>
      <tr>
        <td><code>03_procedures.sql</code></td>
        <td>Contains ACID stored procedures: <code>sp_create_booking</code> (pessimistic seat lock &amp; 10-min hold), <code>sp_confirm_payment</code> (transitions PENDING &rarr; CONFIRMED), <code>sp_cancel_booking</code> (40%/60% cancellation split), and recurring cleanup event <code>e_expire_pending_holds</code>.</td>
      </tr>
      <tr>
        <td><code>04_views.sql</code></td>
        <td>Encapsulates analytical queries: <code>v_public_sanctuaries</code> (sanctuaries with cover image &amp; price range), <code>v_slot_availability</code> (real-time remaining seats computation), and <code>v_confirmed_bookings</code> (joined visitor manifest).</td>
      </tr>
      <tr>
        <td><code>05_seed.sql</code></td>
        <td>Prepopulates realistic production data across all 9 tables: 8 wildlife reserves, verified activities, guides, vehicles, and booking histories.</td>
      </tr>
      <tr>
        <td><code>run_all.js</code></td>
        <td>Automated migration runner executing schema, triggers, procedures, views, seed data, and a 12-test automated assertion suite.</td>
      </tr>
    </tbody>
  </table>

  <h3>Backend Tier (<code>/backend</code>)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">File</th>
        <th>Responsibility &amp; Core Architectural Function</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>server.js</code></td>
        <td>Express application entry point, mounts CORS, JSON body parser, static file streaming (<code>/uploads</code>), and API route clusters.</td>
      </tr>
      <tr>
        <td><code>config/db.js</code></td>
        <td>MySQL2 connection pool manager with auto-reconnection and parameterized query execution.</td>
      </tr>
      <tr>
        <td><code>middleware/auth.js</code></td>
        <td>JWT authentication verification extracting user identity and role from <code>Bearer</code> token header.</td>
      </tr>
      <tr>
        <td><code>middleware/roleCheck.js</code></td>
        <td>RBAC role barrier middleware enforcing role authorization (<code>VISITOR</code>, <code>ADMIN</code>, <code>SITE_OWNER</code>) with HTTP 403 Forbidden on violations.</td>
      </tr>
      <tr>
        <td><code>controllers/authController.js</code></td>
        <td>Handles registration and authentication for all roles: visitor signup, admin operator registration with multipart PDF uploads, and owner login.</td>
      </tr>
      <tr>
        <td><code>controllers/bookingController.js</code></td>
        <td>Visitor booking lifecycle: calls <code>sp_create_booking</code>, fetches real-time hold seconds, streams in-memory PDF boarding tickets with QR codes, and executes cancellations.</td>
      </tr>
      <tr>
        <td><code>controllers/sanctuaryController.js</code></td>
        <td>Public sanctuary catalogue: fetches approved reserves from <code>v_public_sanctuaries</code>, search filtering, and detail page queries.</td>
      </tr>
      <tr>
        <td><code>controllers/adminSanctuaryController.js</code></td>
        <td>Admin sanctuary management: creates draft sanctuaries, validates submission prerequisites, uploads cover photos, and manages safari activities.</td>
      </tr>
      <tr>
        <td><code>controllers/adminBookingController.js</code></td>
        <td>Admin booking manifest: displays passenger lists with masked government ID numbers (e.g. <code>****1234</code>) and operational status filters.</td>
      </tr>
      <tr>
        <td><code>controllers/ownerController.js</code></td>
        <td>Site Owner administrative control: reviews pending operator applications, inspects uploaded PDF license proofs, and approves or rejects admins.</td>
      </tr>
      <tr>
        <td><code>controllers/ownerStatsController.js</code></td>
        <td>Platform analytical metrics: correlated subqueries computing slot occupancy percentages, monthly net revenues, and frequent visitor rankings.</td>
      </tr>
      <tr>
        <td><code>verify_workflow.js</code></td>
        <td>Comprehensive 25-step end-to-end multi-role test suite testing signup, login, draft sanctuary submission, approval, visitor booking, and tickets.</td>
      </tr>
    </tbody>
  </table>

  <h3>Frontend Tier (<code>/frontend/src</code>)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">File</th>
        <th>Responsibility &amp; Core Architectural Function</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>pages/user/Home.jsx</code></td>
        <td>Visitor landing page with hero banner, rotating featured reserves, eco-tourism trust badges, and quick search bar.</td>
      </tr>
      <tr>
        <td><code>pages/user/Sanctuaries.jsx</code></td>
        <td>Public reserve exploration: grid view of approved sanctuaries with starting prices, cover photos, and dynamic ratings.</td>
      </tr>
      <tr>
        <td><code>pages/user/SanctuaryDetail.jsx</code></td>
        <td>Individual sanctuary overview: exhibits reserve description, operating hours, guidelines, and available safari experiences.</td>
      </tr>
      <tr>
        <td><code>pages/user/Payment.jsx</code></td>
        <td>Checkout gateway: displays live 10-minute countdown timer, passenger manifest summary, and mock card payment submission.</td>
      </tr>
      <tr>
        <td><code>pages/user/Bookings.jsx</code></td>
        <td>Visitor dashboard: tabbed view of Upcoming, Past, and Cancelled bookings with one-click PDF boarding pass download and cancellation modal.</td>
      </tr>
      <tr>
        <td><code>pages/admin/Dashboard.jsx</code></td>
        <td>Sanctuary Admin operations overview: occupancy rates, upcoming slots, revenue charts, and quick-action navigation.</td>
      </tr>
      <tr>
        <td><code>pages/admin/SanctuaryForm.jsx</code></td>
        <td>Sanctuary registration and editing form with 1-click &ldquo;Demo Prerequisites&rdquo; autofill attaching sample cover photos, activities, guides, and vehicles.</td>
      </tr>
      <tr>
        <td><code>pages/admin/Signup.jsx</code></td>
        <td>Operator onboarding page featuring <strong>Rotating 8-Operator Auto-fill</strong> cycling through real government wildlife directors and attaching PDF proofs.</td>
      </tr>
      <tr>
        <td><code>pages/owner/AdminRequests.jsx</code></td>
        <td>Site Owner verification dashboard: inspects operator credentials, downloads submitted PDF license proofs, and approves or rejects applications.</td>
      </tr>
      <tr>
        <td><code>pages/owner/Stats.jsx</code></td>
        <td>Site Owner executive analytics: interactive occupancy heatmaps, frequent visitor rankings, and monthly platform revenue breakdowns.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 4: AUTO-FILL ROTATION -->
  <div class="page-break"></div>
  <h2>4. Rotating Auto-Fill Demonstration Data Guide</h2>
  <p>To ensure smooth demonstrations without manual typing or colliding with existing database records, WildBook includes built-in rotation queues:</p>

  <h3>Admin Operator Registration Queue (8 Candidates)</h3>
  <ol>
    <li><strong>Dr. Ananya Roy</strong> &mdash; Sundarbans Biosphere Reserve (Field Director)</li>
    <li><strong>Vikramaditya Chauhan</strong> &mdash; Jim Corbett National Park (Conservator of Forests)</li>
    <li><strong>Kavitha Manjunath</strong> &mdash; Bhadra Bio-Resilience Society (Deputy Conservator of Forests)</li>
    <li><strong>Dr. Rajesh Kumar</strong> &mdash; Kabini Wildlife Reserve (Field Director)</li>
    <li><strong>Bikash Chandra Mohanty</strong> &mdash; Similipal Biosphere Reserve (Deputy Conservator of Forests)</li>
    <li><strong>Fateh Singh Bhati</strong> &mdash; Thar Desert Wildlife Protection Trust (Divisional Forest Officer)</li>
    <li><strong>Pemba Lepcha</strong> &mdash; Khangchendzonga High-Altitude Sanctuary (Senior Range Officer)</li>
    <li><strong>Dr. S. Karthikeyan</strong> &mdash; Anamalai Rainforest Conservation Trust (Chief Naturalist &amp; Trustee)</li>
  </ol>
  <p><em>Each click of the auto-fill button rotates to the next candidate, automatically generates unique registration numbers and official emails, and attaches sample PDF credentials.</em></p>

  <h3>Visitor Registration Queue (6 Travellers)</h3>
  <ol>
    <li><strong>Aditi Rao</strong> &mdash; <code>aditi.rao@wildbook.com</code></li>
    <li><strong>Rohan Verma</strong> &mdash; <code>rohan.verma@wildbook.com</code></li>
    <li><strong>Sneha Kulkarni</strong> &mdash; <code>sneha.kulkarni@wildbook.com</code></li>
    <li><strong>Vikramaditya Sen</strong> &mdash; <code>vikramaditya.sen@wildbook.com</code></li>
    <li><strong>Maya Patel</strong> &mdash; <code>maya.patel@wildbook.com</code></li>
    <li><strong>Arjun Nair</strong> &mdash; <code>arjun.nair@wildbook.com</code></li>
  </ol>

  <div class="footer-note">
    WildBook Eco-Tourism Platform &bull; System Architecture, Relational Integrity &amp; Business Logic Reference Manual &bull; 9-Table Production Schema
  </div>

</body>
</html>`;

const htmlFilePath = path.resolve('d:/Wildbook/WildBook_proj/WildBook_Architecture_and_Logic_Manual.html');
const pdfFilePath = path.resolve('d:/Wildbook/WildBook_proj/WildBook_Architecture_and_Logic_Manual.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('✓ Created updated HTML manual at:', htmlFilePath);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${htmlFilePath}"`;

console.log('Compiling HTML into PDF via headless Chrome...');
execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(pdfFilePath)) {
  const stats = fs.statSync(pdfFilePath);
  console.log(`✓ SUCCESS! Generated PDF (${stats.size} bytes) at: ${pdfFilePath}`);
} else {
  console.error('Failed to generate PDF');
  process.exit(1);
}
