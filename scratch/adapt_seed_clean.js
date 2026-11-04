const fs = require('fs');
const path = require('path');

const seedFile = path.resolve('database/05_seed.sql');
let content = fs.readFileSync(seedFile, 'utf8');

// Normalize line endings to \n for easier regex processing
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Truncate list
content = content.replace(
  /TRUNCATE TABLE reviews;[\s\S]*?TRUNCATE TABLE users;/,
  `TRUNCATE TABLE payments;
TRUNCATE TABLE bookings;
TRUNCATE TABLE slots;
TRUNCATE TABLE vehicles;
TRUNCATE TABLE guides;
TRUNCATE TABLE activities;
TRUNCATE TABLE sanctuaries;
TRUNCATE TABLE admin_profiles;
TRUNCATE TABLE users;`
);

// 2. admin_profiles
content = content.replace(
  `INSERT INTO admin_profiles (
  user_id, organisation_name, license_number, designation, registered_address, website
) VALUES`,
  `INSERT INTO admin_profiles (
  user_id, organisation_name, license_number, designation, registered_address, website, license_doc, identity_doc, auth_letter_doc
) VALUES`
);

content = content.replace(
  "'https://aranya.gov.in'\n),",
  "'https://aranya.gov.in', 'uploads/admin-docs/admin_2_license.pdf', 'uploads/admin-docs/admin_2_identity.pdf', 'uploads/admin-docs/admin_2_authorization.pdf'\n),"
);
content = content.replace(
  "'https://bandipurtigerreserve.in'\n),",
  "'https://bandipurtigerreserve.in', 'uploads/admin-docs/admin_3_license.pdf', 'uploads/admin-docs/admin_3_identity.pdf', 'uploads/admin-docs/admin_3_authorization.pdf'\n),"
);
content = content.replace(
  "'https://kaziranganationalpark.assam.gov.in'\n),",
  "'https://kaziranganationalpark.assam.gov.in', 'uploads/admin-docs/admin_5_license.pdf', 'uploads/admin-docs/admin_5_identity.pdf', 'uploads/admin-docs/admin_5_authorization.pdf'\n),"
);
content = content.replace(
  "'https://rajasthanwildlife.rajasthan.gov.in'\n),",
  "'https://rajasthanwildlife.rajasthan.gov.in', 'uploads/admin-docs/admin_6_license.pdf', 'uploads/admin-docs/admin_6_identity.pdf', 'uploads/admin-docs/admin_6_authorization.pdf'\n),"
);
content = content.replace(
  "'https://girlion.gujarat.gov.in'\n),",
  "'https://girlion.gujarat.gov.in', 'uploads/admin-docs/admin_7_license.pdf', 'uploads/admin-docs/admin_7_identity.pdf', 'uploads/admin-docs/admin_7_authorization.pdf'\n),"
);
content = content.replace(
  "'https://periyartigerreserve.org'\n);",
  "'https://periyartigerreserve.org', 'uploads/admin-docs/admin_8_license.pdf', 'uploads/admin-docs/admin_8_identity.pdf', 'uploads/admin-docs/admin_8_authorization.pdf'\n);"
);

// 3. Remove admin_documents block
const startDoc = content.indexOf('-- 3. ADMIN_DOCUMENTS');
const endDoc = content.indexOf('-- 4. SANCTUARIES');
if (startDoc !== -1 && endDoc !== -1) {
  content = content.slice(0, startDoc) + content.slice(endDoc);
}

// 4. Update sanctuaries insert column list
content = content.replace(
  `INSERT INTO sanctuaries (
  sanctuary_id, admin_id, name, location, description, contact_email, contact_phone, website, opening_time, closing_time, operating_days, best_time_to_visit, latitude, longitude, listing_status, review_note, reviewed_by, reviewed_at, created_at
) VALUES`,
  `INSERT INTO sanctuaries (
  sanctuary_id, admin_id, name, location, description, cover_image, average_rating, total_reviews, contact_email, contact_phone, website, opening_time, closing_time, operating_days, best_time_to_visit, latitude, longitude, listing_status, review_note, reviewed_by, reviewed_at, created_at
) VALUES`
);

content = content.replace(
  "'Spread across lush foothills of the Western Ghats, Nagarhole is famed for one of India’s highest predator densities including Bengal tigers, leopards, and massive herds of Asiatic elephants wandering along the tranquil waters of the Kabini River.', \n  'nagarhole.safari@wildbook.com',",
  "'Spread across lush foothills of the Western Ghats, Nagarhole is famed for one of India’s highest predator densities including Bengal tigers, leopards, and massive herds of Asiatic elephants wandering along the tranquil waters of the Kabini River.', \n  'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80', 5.0, 1,\n  'nagarhole.safari@wildbook.com',"
);

content = content.replace(
  "'Part of the Nilgiri Biosphere Reserve, Bandipur connects with Mudumalai and Wayanad to form a critical wildlife corridor protecting tigers, dholes, sloth bears, Indian gaurs, and over 200 species of vibrant birds.', \n  'bandipur.safari@wildbook.com',",
  "'Part of the Nilgiri Biosphere Reserve, Bandipur connects with Mudumalai and Wayanad to form a critical wildlife corridor protecting tigers, dholes, sloth bears, Indian gaurs, and over 200 species of vibrant birds.', \n  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80', 5.0, 1,\n  'bandipur.safari@wildbook.com',"
);

content = content.replace(
  "'A pristine flood plain of the mighty Brahmaputra river, Kaziranga hosts two-thirds of the world’s Great One-Horned Rhinoceroses alongside Asiatic wild water buffalos, swamp deer, and the highest tiger density in protected areas.', \n  'kaziranga.eco@wildbook.com',",
  "'A pristine flood plain of the mighty Brahmaputra river, Kaziranga hosts two-thirds of the world’s Great One-Horned Rhinoceroses alongside Asiatic wild water buffalos, swamp deer, and the highest tiger density in protected areas.', \n  'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&w=1200&q=80', 5.0, 1,\n  'kaziranga.eco@wildbook.com',"
);

content = content.replace(
  "'Where nature meets royal heritage: ancient 10th-century fort ramparts and cenotaphs overlook scenic lakes where majestic Bengal tigers hunt in broad daylight amidst dry deciduous jungle and dhok trees.', \n  'ranthambore.tours@wildbook.com',",
  "'Where nature meets royal heritage: ancient 10th-century fort ramparts and cenotaphs overlook scenic lakes where majestic Bengal tigers hunt in broad daylight amidst dry deciduous jungle and dhok trees.', \n  'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80', 5.0, 1,\n  'ranthambore.tours@wildbook.com',"
);

content = content.replace(
  "'The sole surviving natural bastion on planet Earth for the regal Asiatic Lion (Panthera leo persica). Gir features rugged teak hills, seasonal rivers, leopards, striped hyenas, and rare marsh crocodiles.', \n  'gir.lion@wildbook.com',",
  "'The sole surviving natural bastion on planet Earth for the regal Asiatic Lion (Panthera leo persica). Gir features rugged teak hills, seasonal rivers, leopards, striped hyenas, and rare marsh crocodiles.', \n  'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=1200&q=80', 5.0, 1,\n  'gir.lion@wildbook.com',"
);

content = content.replace(
  "'Nestled high in the Cardamom and Pandalam hills of the Western Ghats, Periyar is centered around an expansive artificial lake formed by the Mullaperiyar Dam where wild elephants and sambar gather on scenic grassy banks.', \n  'periyar.safari@wildbook.com',",
  "'Nestled high in the Cardamom and Pandalam hills of the Western Ghats, Periyar is centered around an expansive artificial lake formed by the Mullaperiyar Dam where wild elephants and sambar gather on scenic grassy banks.', \n  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80', 4.9, 0,\n  'periyar.safari@wildbook.com',"
);

content = content.replace(
  "'India’s oldest national park nestled in the Himalayan foothills of Nainital. Famed for diverse flora, rich birdlife, the roaring Ramganga River, and legendary royal Bengal tigers roaming the golden grasslands.', \n  'corbett.dhikala@wildbook.com',",
  "'India’s oldest national park nestled in the Himalayan foothills of Nainital. Famed for diverse flora, rich birdlife, the roaring Ramganga River, and legendary royal Bengal tigers roaming the golden grasslands.', \n  'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80', 4.8, 0,\n  'corbett.dhikala@wildbook.com',"
);

content = content.replace(
  "'Pending sanctuary awaiting review and approval by site owner.', \n  'pending@wildbook.com',",
  "'Pending sanctuary awaiting review and approval by site owner.', \n  'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80', 0.0, 0,\n  'pending@wildbook.com',"
);

// 5. Remove sanctuary_images block
const startImg = content.indexOf('-- 5. SANCTUARY_IMAGES');
const endImg = content.indexOf('-- 6. ACTIVITIES');
if (startImg !== -1 && endImg !== -1) {
  content = content.slice(0, startImg) + content.slice(endImg);
}

// 6. Remove booking_attendees, reviews, cancellations
content = content.replace(/INSERT INTO booking_attendees[\s\S]*?;\n/g, '');
content = content.replace(/INSERT INTO reviews[\s\S]*?;\n/g, '');
content = content.replace(/INSERT INTO cancellations[\s\S]*?;\n/g, '');

// 7. Update bookings
content = content.replace(
  /INSERT INTO bookings \(\n  booking_id, booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at, booked_at\n\) VALUES \(/g,
  `INSERT INTO bookings (
  booking_id, booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at, booked_at, cancelled_at, cancellation_reason, cancellation_fee, refund_amount
) VALUES (`
);

// For booking 12:
content = content.replace(
  "12, 'WB-CANC0012', 4, 3, 2, 'CANCELLED', 3600.00, NULL, '2026-10-18 10:00:00'\n);",
  "12, 'WB-CANC0012', 4, 3, 2, 'CANCELLED', 3600.00, NULL, '2026-10-18 10:00:00', '2026-10-20 15:30:00', 'Cancelled by guest', 1440.00, 2160.00\n);"
);

// For all other bookings (1-11, 13, 14):
// They look like: `  X, 'WB-...', ...\n);`
for (let b = 1; b <= 14; b++) {
  if (b === 12) continue;
  // match `  ${b}, 'WB-...', ...\n);`
  const pattern = new RegExp(`(  ${b}, 'WB-[^\\n]+)(\\n\\);)`);
  content = content.replace(pattern, (m, p1, p2) => {
    return p1 + ", NULL, NULL, 0.00, 0.00" + p2;
  });
}

// Re-convert to CRLF if needed
if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(seedFile, content, 'utf8');
console.log('✓ Successfully adapted 05_seed.sql cleanly for 9-table schema');
