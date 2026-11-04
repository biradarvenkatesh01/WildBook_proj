const { execSync } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'D:\\Wildbook\\WildBook_proj\\scratch\\test.html';
const pdfPath = 'D:\\Wildbook\\WildBook_proj\\test_out.pdf';

try {
  const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  console.log('Running cmd:', cmd);
  const out = execSync(cmd, { stdio: 'inherit' });
  console.log('Finished. PDF exists?', fs.existsSync(pdfPath));
} catch (err) {
  console.error('Error running Chrome:', err);
}

