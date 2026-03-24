const fs = require('fs');
let code = fs.readFileSync('src/components/Calendar.tsx', 'utf8');

// Remove min-h-[3rem] from blank cells
code = code.replace(
  /className="aspect-square min-h-\[3rem\]"/g,
  'className="aspect-square"'
);

// Remove min-h-[3rem] from active cells
code = code.replace(
  /className=\{`relative w-full min-w-0 aspect-square min-h-\[3rem\] rounded-lg/g,
  'className={`relative w-full min-w-0 aspect-square rounded-lg'
);

// Remove minHeight from inline styles in Calendar
code = code.replace(
  /minHeight: "48px",\n/g,
  ''
);

// We might want to remove items-stretch from the grid
code = code.replace(
  /className="grid grid-cols-7 gap-1\.5 md:gap-2 w-full max-w-full items-stretch p-1 lg:p-1\.5"/g,
  'className="grid grid-cols-7 gap-1.5 md:gap-2 w-full max-w-full p-1 lg:p-1.5"'
);

fs.writeFileSync('src/components/Calendar.tsx', code, 'utf8');
