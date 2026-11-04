const fs = require('fs');
const path = require('path');
const file = path.resolve('database/05_seed.sql');
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /'https:\/\/bandipurtigerreserve\.in'(\r?\n\);)/,
  "'https://bandipurtigerreserve.in', 'uploads/admin-docs/admin_3_license.pdf', 'uploads/admin-docs/admin_3_identity.pdf', 'uploads/admin-docs/admin_3_authorization.pdf'$1"
);

fs.writeFileSync(file, c, 'utf8');
console.log('✓ Fixed admin 3 in 05_seed.sql');
