'use strict';
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const sanctuaryUploadDir = path.join(__dirname, '..', 'uploads', 'sanctuaries');

if (!fs.existsSync(sanctuaryUploadDir)) {
  fs.mkdirSync(sanctuaryUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, sanctuaryUploadDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `sanctuary-${uniqueSuffix}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image format (${ext}). Allowed formats: JPG, JPEG, PNG, WEBP.`));
  }
}

const sanctuaryUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max per image
  fileFilter,
});

module.exports = {
  sanctuaryUpload,
  sanctuaryUploadDir,
};
