const fs = require('fs');
let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// Use literal strings from what Get-Content returned for encoding differences
code = code.replace(
  /<p className="text-2xl font-bold text-yui-green-800 mb-2">募集項目\n/g,
  '<p className="text-base font-bold text-yui-green-800 mb-2">募集項目\n'
);

code = code.replace(
  /<p className="text-2xl font-bold text-yui-green-800 mb-2">募集項目\s+<span className="text-yui-danger">（必須）<\/span><\/p>/,
  '<p className="text-base font-bold text-yui-green-800 mb-2">募集項目 <span className="text-yui-danger">（必須）</span></p>'
);

code = code.replace(
  /<p className="text-2xl font-bold text-yui-green-800 mb-2">/,
  '<p className="text-base font-bold text-yui-green-800 mb-2">'
);

fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
