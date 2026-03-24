const fs = require('fs');

let code = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

// The titles use: `<h3 className="text-xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 mb-3">`
// We want to reduce text size to base / normal, and also probably remove the large padding.
// Matching other elements like "お住まいの地域" maybe making it text-base or text-lg would fit best. Let's make it text-base.
// Let's also make the icon smaller (w-5 h-5).

code = code.replace(
  /<h3 className="text-xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 mb-3">/g,
  '<h3 className="text-base text-yui-earth-500 font-bold flex items-center gap-2 mb-2">'
);

// We need to change the icons to be smaller to match our other section labels:
// `<Tractor className="w-6 h-6 text-yui-green-600" aria-hidden="true" />` -> `w-5 h-5 text-yui-green-500`
code = code.replace(
  /<Tractor className="w-6 h-6 text-yui-green-600" aria-hidden="true" \/>/g,
  '<Tractor className="w-5 h-5 text-yui-green-500" aria-hidden="true" />'
);

code = code.replace(
  /<Sprout className="w-6 h-6 text-yui-green-600" aria-hidden="true" \/>/g,
  '<Sprout className="w-5 h-5 text-yui-green-500" aria-hidden="true" />'
);

fs.writeFileSync('src/app/profile/page.tsx', code, 'utf8');
console.log("Reduced profile sub-header font sizes.");
