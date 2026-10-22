'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'wildbook_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '2h';

/**
 * Generate 2-hour JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      account_status: user.account_status,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Helper to remove password_hash and sanitize user object
 */
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// ── 1. POST /api/auth/user/signup ─────────────────────────────────────────────
async function userSignup(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    let cleanPhone = null;
    if (phone && phone.trim()) {
      cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
      }
    }

    // Check email uniqueness
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user: role = VISITOR, account_status = APPROVED
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, account_status)
       VALUES (?, ?, ?, ?, 'VISITOR', 'APPROVED')`,
      [name.trim(), email.toLowerCase().trim(), cleanPhone, passwordHash]
    );

    const newUser = {
      user_id: result.insertId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
      role: 'VISITOR',
      account_status: 'APPROVED',
      profile_image: null,
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
}

// ── 2. POST /api/auth/user/login ──────────────────────────────────────────────
async function userLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.query(
      `SELECT user_id, name, email, phone, password_hash, role, account_status, profile_image 
       FROM users 
       WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Reject incorrect portal role with friendly guidance
    if (user.role !== 'VISITOR') {
      const isOwner = user.role === 'SITE_OWNER';
      return res.status(403).json({
        error: isOwner
          ? 'This is a site authority account. Use Authority login'
          : 'This is a sanctuary admin account. Use Admin login',
        targetPortal: isOwner ? '/owner/login' : '/admin/login',
        targetRole: user.role,
        linkText: isOwner ? 'Authority login' : 'Admin login',
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account status
    if (user.account_status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support.',
      });
    }

    const safeUser = sanitizeUser(user);
    const token = generateToken(safeUser);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

// ── 3. POST /api/auth/admin/login ─────────────────────────────────────────────
async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.password_hash, u.role, u.account_status, 
              u.profile_image, u.review_note, ap.organisation_name, ap.license_number
       FROM users u
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Check role with friendly guidance
    if (user.role !== 'ADMIN') {
      const isOwner = user.role === 'SITE_OWNER';
      return res.status(403).json({
        error: isOwner
          ? 'This is a site authority account. Use Authority login'
          : 'This is a visitor account. Use Visitor login',
        targetPortal: isOwner ? '/owner/login' : '/login',
        targetRole: user.role,
        linkText: isOwner ? 'Authority login' : 'Visitor login',
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = sanitizeUser(user);
    const token = generateToken(safeUser);

    // Reject non-APPROVED status with distinct messages including owner note
    if (user.account_status === 'PENDING') {
      return res.status(403).json({
        status: 'PENDING',
        error: 'Your sanctuary admin account is currently under review by the authority.',
        review_note: user.review_note || null,
        token, // provided so frontend can show the pending status page
        user: safeUser,
      });
    }

    if (user.account_status === 'REJECTED') {
      const noteMsg = user.review_note ? ` Reason: "${user.review_note}"` : '';
      return res.status(403).json({
        status: 'REJECTED',
        error: `Your sanctuary admin registration was rejected by the authority.${noteMsg}`,
        review_note: user.review_note || null,
      });
    }

    if (user.account_status === 'SUSPENDED') {
      const noteMsg = user.review_note ? ` Reason: "${user.review_note}"` : '';
      return res.status(403).json({
        status: 'SUSPENDED',
        error: `Your sanctuary administrator privileges have been suspended.${noteMsg}`,
        review_note: user.review_note || null,
      });
    }

    // Approved admin
    return res.status(200).json({
      message: 'Admin login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

// ── 4. POST /api/auth/owner/login ─────────────────────────────────────────────
async function ownerLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.query(
      `SELECT user_id, name, email, phone, password_hash, role, account_status, profile_image 
       FROM users 
       WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];

    // Reject non-SITE_OWNER with friendly guidance
    if (user.role !== 'SITE_OWNER') {
      const isAdmin = user.role === 'ADMIN';
      return res.status(403).json({
        error: isAdmin
          ? 'This is a sanctuary admin account. Use Admin login'
          : 'This is a visitor account. Use Visitor login',
        targetPortal: isAdmin ? '/admin/login' : '/login',
        targetRole: user.role,
        linkText: isAdmin ? 'Admin login' : 'Visitor login',
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const safeUser = sanitizeUser(user);
    const token = generateToken(safeUser);

    return res.status(200).json({
      message: 'Authority portal login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

// ── 5. POST /api/auth/admin/signup ────────────────────────────────────────────
async function adminSignup(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const {
      name,
      email,
      phone,
      password,
      organisation_name,
      license_number,
      designation,
      registered_address,
      website,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !organisation_name ||
      !license_number ||
      !designation ||
      !registered_address
    ) {
      return res.status(400).json({
        error:
          'Full name, email, password, organisation name, license number, designation, and address are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Admin password must be at least 8 characters long.' });
    }

    let cleanPhone = null;
    if (phone && phone.trim()) {
      cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
      }
    }

    // Validate required documents from multer files
    const files = req.files || {};
    if (!files.license || !files.identity || !files.authorization) {
      return res.status(400).json({
        error:
          'All three verification documents (License, Identity Proof, Authorization Letter) are required.',
      });
    }

    // Check email uniqueness
    const [emailCheck] = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (emailCheck.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Check license uniqueness
    const [licenseCheck] = await conn.query(
      'SELECT user_id FROM admin_profiles WHERE license_number = ?',
      [license_number]
    );
    if (licenseCheck.length > 0) {
      return res
        .status(409)
        .json({ error: 'An administrator with this license number is already registered.' });
    }

    await conn.beginTransaction();

    // 1. Insert user: role = ADMIN, account_status = PENDING
    const passwordHash = await bcrypt.hash(password, 10);
    const [userRes] = await conn.query(
      `INSERT INTO users (name, email, phone, password_hash, role, account_status)
       VALUES (?, ?, ?, ?, 'ADMIN', 'PENDING')`,
      [name.trim(), email.toLowerCase().trim(), cleanPhone, passwordHash]
    );

    const newAdminId = userRes.insertId;

    // 2. Insert admin profile
    await conn.query(
      `INSERT INTO admin_profiles (user_id, organisation_name, license_number, designation, registered_address, website)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newAdminId,
        organisation_name.trim(),
        license_number.trim(),
        designation.trim(),
        registered_address.trim(),
        website ? website.trim() : null,
      ]
    );

    // 3. Insert the 3 uploaded documents
    const docEntries = [
      { type: 'LICENSE', file: files.license[0] },
      { type: 'IDENTITY', file: files.identity[0] },
      { type: 'AUTHORIZATION', file: files.authorization[0] },
    ];

    for (const doc of docEntries) {
      // Relative path stored in DB
      const relativePath = path.join('uploads', 'admin-docs', doc.file.filename).replace(/\\/g, '/');
      await conn.query(
        `INSERT INTO admin_documents (admin_id, doc_type, file_path)
         VALUES (?, ?, ?)`,
        [newAdminId, doc.type, relativePath]
      );
    }

    await conn.commit();

    const newUser = {
      user_id: newAdminId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      role: 'ADMIN',
      account_status: 'PENDING',
      organisation_name: organisation_name.trim(),
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      message:
        'Registration submitted successfully. Your account is pending verification and approval by the site authority.',
      token,
      user: newUser,
    });
  } catch (err) {
    await conn.rollback();
    // Clean up uploaded files if transaction failed
    if (req.files) {
      Object.values(req.files).forEach((fileArr) => {
        fileArr.forEach((file) => {
          fs.unlink(file.path, () => {});
        });
      });
    }
    next(err);
  } finally {
    conn.release();
  }
}

// ── 6. GET /api/auth/me ───────────────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const user = req.user;

    // If admin, attach profile info
    if (user.role === 'ADMIN') {
      const [profile] = await pool.query(
        `SELECT organisation_name, license_number, designation, registered_address, website 
         FROM admin_profiles 
         WHERE user_id = ?`,
        [user.user_id]
      );
      return res.status(200).json({
        user: {
          ...user,
          profile: profile[0] || null,
        },
      });
    }

    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  userSignup,
  userLogin,
  adminLogin,
  ownerLogin,
  adminSignup,
  getMe,
};
