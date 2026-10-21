const path = require('path');
const bcrypt = require(path.resolve(__dirname, '../backend/node_modules/bcryptjs'));

/**
 * Generates bcrypt password hashes for seed accounts with cost factor 10.
 * Default passwords:
 * - owner@wildbook.com:       Owner@123
 * - admin.nagarhole@wildbook.com: Admin@123
 * - admin.bandipur@wildbook.com:  Admin@123
 * - visitor@wildbook.com:     Visitor@123
 */
async function generateHashes() {
  const passwords = {
    owner: 'Owner@123',
    admin: 'Admin@123',
    visitor: 'Visitor@123',
  };

  const hashes = {};
  for (const [key, plain] of Object.entries(passwords)) {
    hashes[key] = await bcrypt.hash(plain, 10);
  }

  console.log('--- SEED PASSWORDS & BCRYPT HASHES ---');
  for (const [key, plain] of Object.entries(passwords)) {
    console.log(`${key} (${plain}) => ${hashes[key]}`);
  }
}

generateHashes().catch(console.error);
