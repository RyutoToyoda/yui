const fs = require('fs');
let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

code = code.replace(
  '<section className="bg-white rounded-2xl border-2 border-yui-green-100 p-3 md:p-4 w-full min-w-0 overflow-x-hidden">',
  '<section className="bg-white rounded-2xl border-2 border-yui-green-100 p-5 md:p-6 w-full min-w-0 overflow-x-hidden">'
);

fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
