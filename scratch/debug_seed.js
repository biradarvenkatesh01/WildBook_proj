const fs = require('fs');
const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

async function debugSeed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wildbook',
    multipleStatements: true
  });

  const seedSql = fs.readFileSync(path.join(__dirname, '../database/05_seed.sql'), 'utf8');
  // Clean comments and split on semicolons
  const stmts = seedSql.split(/;\s*[\r\n]+/);
  
  for (let i = 0; i < stmts.length; i++) {
    // Strip pure comment lines
    const lines = stmts[i].split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim();
    if (!lines) continue;
    try {
      await connection.query(lines);
      console.log(`✓ Stmt ${i} passed: ${lines.slice(0, 35).replace(/\n/g, ' ')}...`);
    } catch (err) {
      console.error(`✗ Stmt ${i} failed: ${lines.slice(0, 35).replace(/\n/g, ' ')}...`);
      console.error(err.message);
      break;
    }
  }

  await connection.end();
}

debugSeed().catch(console.error);
