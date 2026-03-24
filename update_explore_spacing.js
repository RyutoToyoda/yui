const fs = require('fs');
let code = fs.readFileSync('src/app/explore/page.tsx', 'utf8');

// Modify the two-column container
code = code.replace(
  /<div className="flex justify-between items-stretch gap-3 mb-1 min-h-\[110px\]">/,
  '<div className="flex justify-between gap-3 mb-1">'
);

// Remove mt-auto from the left side info
code = code.replace(
  /<div className="space-y-1\.5 mt-auto">/,
  '<div className="space-y-1.5">'
);

// Remove h-full and justify-between from the right side
code = code.replace(
  /<div className="flex flex-col items-end gap-1 shrink-0 h-full justify-between pb-0\.5">/,
  '<div className="flex flex-col items-end gap-2 shrink-0 pb-0.5">'
);

fs.writeFileSync('src/app/explore/page.tsx', code, 'utf8');
