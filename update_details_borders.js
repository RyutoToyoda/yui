const fs = require('fs');

let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// 1. Add border and match border radius/padding of the section
// Current: <section className="bg-white rounded-3xl p-5 md:p-6">
// Main section: <section className="bg-white rounded-2xl border-2 border-yui-green-100 p-5 md:p-6 space-y-4 w-full min-w-0 overflow-x-hidden">
code = code.replace(
  /<section className="bg-white rounded-3xl p-5 md:p-6">/,
  '<section className="bg-white rounded-2xl border-2 border-yui-green-100 p-3 md:p-4 w-full min-w-0 overflow-x-hidden">'
);

// 2. Remove standard minHeight of the button
// Current: style={{ minHeight: "52px" }}
// And reduce the gap when expanded
code = code.replace(
  /className="w-full flex items-center justify-between text-left"\s+style=\{\{ minHeight: "52px" \}\}/,
  'className="w-full flex items-center justify-between text-left py-1"'
);

// 3. Remove excess padding when expanded
// Current: <div className="mt-4 space-y-4 pt-4"> -> maybe `mt-2 space-y-4 pt-2 border-t-2 border-dashed border-yui-green-100/50` for consistency?
// Let's just remove pt-4 and mt-4 and make it tighter.
code = code.replace(
  /<div className="mt-4 space-y-4 pt-4">/,
  '<div className="mt-2 space-y-4 pt-2 border-t-2 border-dashed border-yui-green-100/50">'
);

// We need to re-read to see exactly how it looks
fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
console.log("Updated Details section borders and spacing.");
