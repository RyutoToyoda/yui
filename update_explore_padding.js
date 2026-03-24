const fs = require('fs');
let code = fs.readFileSync('src/app/explore/page.tsx', 'utf8');

// Change p-5 to px-5 pt-4 pb-3 on componentProps to reduce bottom padding
code = code.replace(
  /className: `block relative h-full w-full min-w-0 bg-white rounded-xl p-5 shadow-sm border-2 transition-colors no-underline \$\{bgGradient\}`/,
  'className: `block relative w-full min-w-0 bg-white rounded-xl px-4 pt-4 pb-3 shadow-sm border-2 transition-colors no-underline ${bgGradient}`'
);

// Reduce mt-1 on the flex container inside JobCard
code = code.replace(
  /<div className="flex w-full min-w-0 flex-col h-full mt-1">/,
  '<div className="flex w-full min-w-0 flex-col">'
);

// Remove the explicit min-h constraints just in case we didn't before, though we did.
// Reduce the mb-1 on the flex justify-between container to mb-0
code = code.replace(
  /<div className="flex justify-between gap-3 mb-1">/,
  '<div className="flex justify-between gap-3 mb-0">'
);

fs.writeFileSync('src/app/explore/page.tsx', code, 'utf8');
