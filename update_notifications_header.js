const fs = require('fs');

let code = fs.readFileSync('src/app/notifications/page.tsx', 'utf8');

// Update header spacing
code = code.replace(
  /<div className="py-3 space-y-4 pb-20">/,
  '<div className="pt-1 space-y-3 pb-20">'
);

code = code.replace(
  /<h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 flex-1">/,
  '<h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-1 flex-1">'
);

fs.writeFileSync('src/app/notifications/page.tsx', code, 'utf8');
console.log("Updated Notifications page header margins.");
