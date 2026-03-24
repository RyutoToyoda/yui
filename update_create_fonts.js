const fs = require('fs');
let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// The h1 "募集する" is text-2xl md:text-3xl font-bold, we leave that alone.
// The success message <h2> is text-2xl, we leave that alone or change it to text-xl maybe? Let's leave it.

// Labels
code = code.replace(
  /<label htmlFor="job-title" className="block text-2xl font-bold text-yui-green-800">/g,
  '<label htmlFor="job-title" className="block text-base font-bold text-yui-green-800">'
);

code = code.replace(
  /<p className="text-2xl font-bold text-yui-green-800 mb-2">募集項目\n/g,
  '<p className="text-base font-bold text-yui-green-800 mb-2">募集項目\n'
);

code = code.replace(
  /<label htmlFor="job-location" className="relative z-10 text-2xl font-bold text-yui-green-800 mb-2 flex items-center gap-2">/g,
  '<label htmlFor="job-location" className="relative z-10 text-base font-bold text-yui-green-800 mb-2 flex items-center gap-2">'
);

code = code.replace(
  /<label htmlFor="job-date" className="text-2xl font-bold text-yui-green-800 mb-2 flex items-center gap-2">/g,
  '<label htmlFor="job-date" className="text-base font-bold text-yui-green-800 mb-2 flex items-center gap-2">'
);

code = code.replace(
  /<label htmlFor="job-start" className="text-2xl font-bold text-yui-green-800 mb-2 flex items-center gap-2">/g,
  '<label htmlFor="job-start" className="text-base font-bold text-yui-green-800 mb-2 flex items-center gap-2">'
);

code = code.replace(
  /<p className="block text-2xl font-bold text-yui-green-800 mb-2">ポイント単価（1時間あたり）<\/p>/g,
  '<p className="block text-base font-bold text-yui-green-800 mb-2">ポイント単価（1時間あたり）</p>'
);

// Advanced settings title
code = code.replace(
  /<span className="text-lg font-bold text-yui-green-800">詳細設定（任意）<\/span>/g,
  '<span className="text-base font-bold text-yui-green-800">詳細設定（任意）</span>'
);

fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');