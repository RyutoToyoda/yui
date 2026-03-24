const fs = require('fs');

let code = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');

// The section used to be: '<section aria-labelledby="important-notice">'
// We restore space-y-3, so it matches the other headers exactly
code = code.replace(
  /<section aria-labelledby="important-notice">/g,
  '<section aria-labelledby="important-notice" className="space-y-3">'
);

// We keep the mb-1 on the h2 since that's what we did directly on all the h1s earlier!

fs.writeFileSync('src/app/schedule/page.tsx', code, 'utf8');
console.log("Restored space-y-3 on section, relying on the previous mb-1 fix for the correct gap.");
