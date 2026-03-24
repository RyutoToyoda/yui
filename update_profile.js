const fs = require('fs');

let code = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

// Update header spacing
code = code.replace(
  /<div className="py-3 space-y-4 pb-20">/,
  '<div className="pt-1 space-y-3 pb-20">'
);

code = code.replace(
  /<h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 pb-2">/,
  '<h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-1">'
);

// Update Location label & info
code = code.replace(
  /<p className="text-xs text-yui-earth-500 font-medium">お住まいの地域<\/p>/,
  '<p className="text-sm text-yui-earth-500 font-medium">お住まいの地域</p>'
);

code = code.replace(
  /<p className="text-sm font-bold text-yui-green-800">\{user\.location \|\| "まだ設定していません"\}<\/p>/,
  '<p className="text-base font-bold text-yui-green-800">{user.location || "まだ設定していません"}</p>'
);

// Update Age Group label & info
code = code.replace(
  /<p className="text-xs text-yui-earth-500 font-medium">年齢層<\/p>/,
  '<p className="text-sm text-yui-earth-500 font-medium">年齢層</p>'
);

code = code.replace(
  /<p className="text-sm font-bold text-yui-green-800">\{user\.ageGroup\}<\/p>/,
  '<p className="text-base font-bold text-yui-green-800">{user.ageGroup}</p>'
);

fs.writeFileSync('src/app/profile/page.tsx', code, 'utf8');
console.log("Updated Profile page styles.");
