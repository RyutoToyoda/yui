const fs = require('fs');

let content = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// I also want to make the buttons text size smaller and reduce tabs padding
content = content.replace(/py-3 rounded-xl text-base/g, 'py-2 rounded-lg text-sm');

// Remove border-2 rounded-2xl padding etc
content = content.replace(/rounded-2xl/g, 'rounded-xl');

// Logo size could be a bit smaller still and take less space
content = content.replace(
  '<div className="w-32 h-32 mx-auto mb-2 mt-4 rounded-4xl flex items-center justify-center">',
  '<div className="w-24 h-24 mx-auto mb-1 mt-0 flex items-center justify-center">' // slightly smaller still
);

content = content.replace(
  '<YuiLogo width={240} height={240} />',
  '<YuiLogo width={160} height={160} />'
);

content = content.replace(
  'const inputClass =\n    "w-full px-3 py-2.5 text-sm border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-yui-earth-50 placeholder:text-yui-earth-400";',
  'const inputClass =\n    "w-full px-3 py-2 text-sm border border-yui-green-200 rounded-lg focus:border-yui-green-500 focus:outline-none bg-yui-earth-50 placeholder:text-yui-earth-400";' // change padding, border size, rounded to lg instead of xl
);

// Form gap
content = content.replace(/mb-2/g, 'mb-1');

fs.writeFileSync('src/app/login/page.tsx', content);

console.log("Updated login page styling again!");