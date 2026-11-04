const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wildbook'
  });
  const [rows] = await conn.query('SELECT sanctuary_id, name, cover_image, listing_status FROM sanctuaries');
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
})();

