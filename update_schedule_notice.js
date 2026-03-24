const fs = require('fs');

let code = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');

code = code.replace(
  '<section aria-labelledby="important-notice" className="space-y-3">',
  '<section aria-labelledby="important-notice">'
);

fs.writeFileSync('src/app/schedule/page.tsx', code, 'utf8');
console.log("Updated Notice section wrapper to remove space-y.");
