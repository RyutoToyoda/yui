const fs = require('fs');

let code = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');

// The section used to be: '<section aria-labelledby="important-notice">'
// Replace space-y-3 from it
code = code.replace(
  /<section aria-labelledby="important-notice" className="space-y-3">/g,
  '<section aria-labelledby="important-notice">'
);

fs.writeFileSync('src/app/schedule/page.tsx', code, 'utf8');
console.log("Removed space-y-3 on section, relying fully on the minimal mb-1 fix for the correct gap.");
