const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

// Remove overflow-x-clip because it causes disappearing, body handles x-overflow
code = code.replace(
  /className="fixed md:hidden bottom-0 left-0 right-0 z-50 overflow-x-clip"/,
  'className="fixed md:hidden bottom-0 left-0 right-0 z-50 pointer-events-none"'
);

// We need pointer-events-auto for children
code = code.replace(
  /<button\s+onClick=\{\(\) => setShowAiChat\(true\)\}\s+className="absolute z-10 rounded-full bg-yui-green-600 hover:bg-yui-green-500 transition-all active:scale-95 border-none cursor-pointer"/,
  '<button\n          onClick={() => setShowAiChat(true)}\n          className="absolute z-10 rounded-full bg-yui-green-600 hover:bg-yui-green-500 transition-all active:scale-95 border-none cursor-pointer pointer-events-auto"'
);

code = code.replace(
  /<div className="relative bg-white\/95 backdrop-blur-xl border-t-2 border-yui-green-200\/60 shadow-\[0_-2px_16px_rgba\(20,58,28,0\.08\)\]">/,
  '<div className="relative bg-white/95 backdrop-blur-xl border-t-2 border-yui-green-200/60 shadow-[0_-2px_16px_rgba(20,58,28,0.08)] pointer-events-auto">'
);

// Scale down the huge button to a sensible partial circle
code = code.replace(
  /style=\{\{\n\s*width: "200px",\n\s*height: "200px",\n\s*right: "-68px",\n\s*bottom: "-68px",/g,
  `style={{
            width: "150px",
            height: "150px",
            right: "-48px",
            bottom: "-48px",`
);

code = code.replace(
  /style=\{\{ top: "36px", left: "48px" \}\}/,
  'style={{ top: "28px", left: "36px" }}'
);
code = code.replace(
  /<Bot className="w-10 h-10 text-white" aria-hidden="true" \/>/,
  '<Bot className="w-8 h-8 text-white" aria-hidden="true" />'
);
code = code.replace(
  /<span className="mt-2 text-sm font-medium text-white whitespace-nowrap">/,
  '<span className="mt-1 text-xs font-medium text-white whitespace-nowrap">'
);

// Scale down tabs slightly
code = code.replace(/minHeight: "64px"/g, 'minHeight: "56px"');
code = code.replace(/minWidth: "72px"/g, 'minWidth: "52px"');
code = code.replace(/minHeight: "48px"/g, 'minHeight: "34px"');
code = code.replace(/w-\[48px\] h-\[48px\]/g, 'w-[28px] h-[28px]');
code = code.replace(/text-base mt-1/g, 'text-xs mt-1');

// Scale down spacer
code = code.replace(/minHeight: "52px"/g, 'minHeight: "56px"');

fs.writeFileSync('src/components/BottomNav.tsx', code, 'utf8');
