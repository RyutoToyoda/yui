const fs = require('fs');

let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// Update 詳細設定 header text
code = code.replace(
  /<span className="text-base font-bold text-yui-green-800">詳細設定（任意）<\/span>/g,
  '<span className="text-xl md:text-2xl font-bold text-yui-green-800">詳細設定（任意）</span>'
);

// Add borders to the textarea and adjust padding
code = code.replace(
  /className="w-full px-4 py-4 text-base rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"/g,
  'className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"'
);

fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
console.log("Updated Details section on Create page.");
