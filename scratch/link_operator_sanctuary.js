const fs = require('fs');
const path = require('path');

const root = path.resolve('d:/Wildbook/WildBook_proj');

// 1. Update backend/controllers/authController.js
{
  const filePath = path.join(root, 'backend/controllers/authController.js');
  let c = fs.readFileSync(filePath, 'utf8');

  const oldTarget = `    for (const doc of docEntries) {
      // Relative path stored in DB
      const relativePath = path.join('uploads', 'admin-docs', doc.file.filename).replace(/\\\\/g, '/');
      await conn.query(
        \`INSERT INTO admin_documents (admin_id, doc_type, file_path)
         VALUES (?, ?, ?)\`,
        [newAdminId, doc.type, relativePath]
      );
    }

    await conn.commit();`;

  const newTarget = `    for (const doc of docEntries) {
      // Relative path stored in DB
      const relativePath = path.join('uploads', 'admin-docs', doc.file.filename).replace(/\\\\/g, '/');
      await conn.query(
        \`INSERT INTO admin_documents (admin_id, doc_type, file_path)
         VALUES (?, ?, ?)\`,
        [newAdminId, doc.type, relativePath]
      );
    }

    // 4. Provision initial sanctuary for operator registration
    const [sancRes] = await conn.query(
      \`INSERT INTO sanctuaries (
        admin_id, name, location, description, contact_email, contact_phone, 
        website, opening_time, closing_time, operating_days, best_time_to_visit, 
        listing_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '06:00:00', '18:00:00', 'Monday to Sunday', 'October to May', 'PENDING')\`,
      [
        newAdminId,
        organisation_name.trim(),
        registered_address.trim(),
        \`Official wildlife sanctuary and protected natural habitat managed by \${organisation_name.trim()}.\`,
        email.toLowerCase().trim(),
        cleanPhone,
        website ? website.trim() : null,
      ]
    );

    const newSanctuaryId = sancRes.insertId;

    // Attach sample cover photo
    await conn.query(
      \`INSERT INTO sanctuary_images (sanctuary_id, image_path, is_cover, sort_order)
       VALUES (?, 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80', TRUE, 1)\`,
      [newSanctuaryId]
    );

    // Attach sample safari activity
    const [actRes] = await conn.query(
      \`INSERT INTO activities (sanctuary_id, activity_name, description, duration_minutes, what_to_carry, price, is_active)
       VALUES (?, 'Wilderness 4x4 Jeep Safari Experience', 'Guided exploratory safari through core wildlife corridors and natural habitats.', 180, 'Govt Photo ID, camera, neutral clothing', 1800.00, TRUE)\`,
      [newSanctuaryId]
    );

    // Guide
    const [guideRes] = await conn.query(
      \`INSERT INTO guides (sanctuary_id, name, phone, experience)
       VALUES (?, 'Senior Forest Guide', '9876543210', 8)\`,
      [newSanctuaryId]
    );

    // Vehicle
    const [vehRes] = await conn.query(
      \`INSERT INTO vehicles (sanctuary_id, vehicle_type, capacity)
       VALUES (?, 'Open 4x4 Safari Gypsy', 6)\`,
      [newSanctuaryId]
    );

    // Scheduled Slot
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const slotDateStr = futureDate.toISOString().slice(0, 10);
    await conn.query(
      \`INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
       VALUES (?, ?, ?, ?, '06:30:00', 6, TRUE)\`,
      [actRes.insertId, guideRes.insertId, vehRes.insertId, slotDateStr]
    );

    await conn.commit();`;

  if (!c.includes('Provision initial sanctuary for operator registration')) {
    const normC = c.replace(/\r\n/g, '\n');
    const normTarget = oldTarget.replace(/\r\n/g, '\n');
    if (normC.includes(normTarget)) {
      c = normC.replace(normTarget, newTarget);
      fs.writeFileSync(filePath, c, 'utf8');
      console.log('✓ Updated authController.js: Auto-provisions sanctuary on operator registration');
    } else {
      console.error('Target not found in authController.js');
    }
  }
}

// 2. Update backend/controllers/ownerController.js
{
  const filePath = path.join(root, 'backend/controllers/ownerController.js');
  let c = fs.readFileSync(filePath, 'utf8');

  const oldTarget = `    await pool.query(
      \`UPDATE users 
       SET account_status = ?,
           reviewed_by = ?,
           reviewed_at = NOW(),
           review_note = ?
       WHERE user_id = ?\`,
      [decision, reviewerId, note ? note.trim() : null, adminId]
    );`;

  const newTarget = `    await pool.query(
      \`UPDATE users 
       SET account_status = ?,
           reviewed_by = ?,
           reviewed_at = NOW(),
           review_note = ?
       WHERE user_id = ?\`,
      [decision, reviewerId, note ? note.trim() : null, adminId]
    );

    // When approving an operator account, automatically approve any pending sanctuary belonging to them
    if (decision === 'APPROVED') {
      await pool.query(
        \`UPDATE sanctuaries 
         SET listing_status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), review_note = ?
         WHERE admin_id = ? AND listing_status = 'PENDING'\`,
        [reviewerId, note ? note.trim() : 'Operator application approved', adminId]
      );
    }`;

  if (!c.includes('When approving an operator account, automatically approve')) {
    const normC = c.replace(/\r\n/g, '\n');
    const normTarget = oldTarget.replace(/\r\n/g, '\n');
    if (normC.includes(normTarget)) {
      c = normC.replace(normTarget, newTarget);
      fs.writeFileSync(filePath, c, 'utf8');
      console.log('✓ Updated ownerController.js: Approving admin automatically approves their sanctuary');
    } else {
      console.error('Target not found in ownerController.js');
    }
  }
}

