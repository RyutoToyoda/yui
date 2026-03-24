const fs = require('fs');
let code = fs.readFileSync('src/components/Calendar.tsx', 'utf8');

code = code.replace(
  /\s*minHeight: "48px",/,
  ''
);

fs.writeFileSync('src/components/Calendar.tsx', code, 'utf8');
