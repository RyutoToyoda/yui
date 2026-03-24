const fs = require('fs');

let content = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// 1. the logo container sizing and padding
content = content.replace(
  '<div className="w-96 h-96 mx-auto mb-0 rounded-4xl flex items-center justify-center">',
  '<div className="w-32 h-32 mx-auto mb-2 mt-4 rounded-4xl flex items-center justify-center">' // Adjust the size and margin top
);
content = content.replace(
  '<YuiLogo width={560} height={560} />',
  '<YuiLogo width={240} height={240} />'
);
content = content.replace(
  '<p className="text-lg text-yui-earth-500 mt-0 tracking-wide">農家のためのタイムバンク</p>',
  '<p className="text-sm text-yui-earth-500 mt-1 mb-2 tracking-wide">農家のためのタイムバンク</p>' // smaller text and less margin
);

// 2. padding inside the whole page
content = content.replace(
  '<div className="min-h-screen bg-white flex flex-col items-center justify-start px-5 pt-4 pb-8">',
  '<div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-4">' 
);

// 3. reduce padding in form card
content = content.replace(
  '<div className="w-full max-w-[400px] bg-white border-2 border-yui-green-200 rounded-3xl shadow-lg p-7 mt-1">',
  '<div className="w-full max-w-[400px] bg-white border-2 border-yui-green-200 rounded-3xl shadow-lg p-5">'
);

// 4. Input class spacing
content = content.replace(
  'const inputClass =\n    "w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-2xl focus:border-yui-green-500 focus:outline-none bg-yui-earth-50 placeholder:text-yui-earth-400";',
  'const inputClass =\n    "w-full px-3 py-2.5 text-sm border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-yui-earth-50 placeholder:text-yui-earth-400";'
);

// 5. smaller spacing inside forms
content = content.replace(/className="space-y-5"/g, 'className="space-y-3"');
content = content.replace(/mb-6/g, 'mb-4');
content = content.replace(/mt-8/g, 'mt-4');

// 6. tabs min height and buttons min-height
content = content.replace(/style={{ minHeight: "48px" }}/g, 'style={{ minHeight: "40px" }}');
content = content.replace(/style={{ minHeight: "56px" }}/g, 'style={{ minHeight: "44px" }}');
content = content.replace(/py-4/g, 'py-2.5'); // for buttons mostly
content = content.replace(/text-lg/g, 'text-base'); 

fs.writeFileSync('src/app/login/page.tsx', content);

console.log("Updated login page styling!");