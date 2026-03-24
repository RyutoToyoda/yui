const fs = require('fs');

let code = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');

code = code.replace(
  /<h2 id="important-notice" className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 pb-2">/g,
  '<h2 id="important-notice" className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-1">'
);

fs.writeFileSync('src/app/schedule/page.tsx', code, 'utf8');
console.log("Updated Notice header spacing in schedule/page.tsx");
