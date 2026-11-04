const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { getSanctuaryPhoto } = require('../backend/utils/sanctuaryPhotos');

async function updatePhotos() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wildbook',
  });

  const [sanctuaries] = await conn.query('SELECT sanctuary_id, name, cover_image FROM sanctuaries');
  console.log(`Found ${sanctuaries.length} sanctuaries in database.`);

  const usedUrls = new Set();

  for (const s of sanctuaries) {
    let distinctPhoto = getSanctuaryPhoto(s.name, s.sanctuary_id);
    if (usedUrls.has(distinctPhoto)) {
      // Pick another distinct one
      distinctPhoto = getSanctuaryPhoto(s.name, s.sanctuary_id + 7);
    }
    usedUrls.add(distinctPhoto);

    await conn.query('UPDATE sanctuaries SET cover_image = ? WHERE sanctuary_id = ?', [
      distinctPhoto,
      s.sanctuary_id,
    ]);
    console.log(`✓ Sanctuary ${s.sanctuary_id} ("${s.name}") updated to: ${distinctPhoto}`);
  }

  const [updated] = await conn.query('SELECT sanctuary_id, name, cover_image FROM sanctuaries');
  console.log('\nUpdated Sanctuaries:');
  console.table(updated);

  await conn.end();
}

updatePhotos().catch(console.error);

