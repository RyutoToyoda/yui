const fs = require('fs');
let code = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

code = code.replace(/sampleSize: "16px"/, 'sampleSize: "12px"');
code = code.replace(/sampleSize: "20px"/, 'sampleSize: "14px"');
code = code.replace(/sampleSize: "24px"/, 'sampleSize: "16px"');

fs.writeFileSync('src/app/settings/page.tsx', code, 'utf8');
