const fs = require('fs');

let code = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

// I will make the labels `text-base` and the info `text-base` or leave info `text-base` but make sure the label doesn't look weird
code = code.replace(
  /<p className="text-sm text-yui-earth-500 font-medium">お住まいの地域<\/p>/,
  '<p className="text-base text-yui-earth-500 font-medium">お住まいの地域</p>'
);

code = code.replace(
  /<p className="text-sm text-yui-earth-500 font-medium">年齢層<\/p>/,
  '<p className="text-base text-yui-earth-500 font-medium">年齢層</p>'
);

fs.writeFileSync('src/app/profile/page.tsx', code, 'utf8');
console.log("Updated Profile label sizes to match text-base fully.");
