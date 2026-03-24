const fs = require('fs');

let code = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

// Reduce vertical padding on the green profile header
code = code.replace(
  /<div className="bg-gradient-to-r from-yui-green-600 to-yui-green-700 px-5 py-6 text-white relative">/,
  '<div className="bg-gradient-to-r from-yui-green-600 to-yui-green-700 px-5 py-4 text-white relative">'
);

// We also added `mt-2` to the flex container in the previous script. Let's make it `mt-0.5` so it fits tighter with the padding.
code = code.replace(
  /<div className="flex items-center gap-4 mt-2">/,
  '<div className="flex items-center gap-4 mt-0.5">'
);

fs.writeFileSync('src/app/profile/page.tsx', code, 'utf8');
console.log("Reduced Profile header padding.");
