'use strict';
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const adminDocsDir = path.join(__dirname, '..', 'uploads', 'admin-docs');

// Ensure directory exists
if (!fs.existsSync(adminDocsDir)) {
  fs.mkdirSync(adminDocsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, adminDocsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid document type: ${ext}. Allowed formats: PDF, JPG, PNG.`));
  }
}

const adminDocUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per document
  fileFilter,
});

module.exports = {
  adminDocUpload,
  adminDocsDir,
};
