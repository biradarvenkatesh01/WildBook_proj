'use strict';
require('dotenv').config();


const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files ──────────────────────────────────────────────────────────────
// Only public sanctuary images are served statically.
// admin-docs are NOT exposed here (Phase 3 streams them after an ownership check).
app.use(
  '/uploads/sanctuaries',
  express.static(path.join(__dirname, 'uploads', 'sanctuaries'))
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/health', require('./routes/health'));

// Stub route placeholders for future phases ───────────────────────────────────
// Phase 2 — Authentication
app.use('/api/auth', require('./routes/auth'));

// Phase 3-11 stubs
const stubRouter = (label) =>
  express.Router().use((_req, res) =>
    res.status(501).json({ error: `${label} not yet implemented` })
  );

// Phase 3 — Site Owner portal
app.use('/api/owner', require('./routes/owner'));

// Phase 4 — Admin sanctuaries
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sanctuaries', require('./routes/sanctuaries'));
// Phase 8 & 9 — Bookings and Payments
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
// Phase 10 — Reviews
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/activities', require('./routes/activities'));

// ── 404 for unknown API paths ─────────────────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ── Central error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  // Start background hold expiration cron job
  require('./jobs/expireHolds').start();

  app.listen(PORT, () => {
    console.log(`WildBook API listening on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
