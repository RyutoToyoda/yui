const fs = require('fs');

let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

// The current circle size is 140px, offset by -44px. 
// We will shrink it to 110px. If size goes from 140 -> 110, the center moves. 
// If we want it to still align its inner center well, let's test shrinking size.
// 140px size, -44 right/bottom, means ~96px is visible up/left, origin is 26px from edge.
// Let's change weight to 110px, right/bottom: -32px.
// Visual space = 110 - 32 = 78px.
// Inner icon top/left should decrease too. Previously it was top: 28px, left: 36px.
// Now: top: 20px, left: 24px could work.

code = code.replace(
  /width: "140px",\s*height: "140px",\s*right: "-44px",\s*bottom: "-44px",/s,
  'width: "110px",\n            height: "110px",\n            right: "-32px",\n            bottom: "-32px",'
);

code = code.replace(
  /style=\{\{ top: "28px", left: "36px" \}\}/,
  'style={{ top: "20px", left: "26px" }}'
);

// Reduce icon size slightly from w-8 h-8 to w-6 h-6, and text size from mt-1 to mt-0.5
code = code.replace(
  /<Bot className="w-8 h-8 text-white" aria-hidden="true" \/>/,
  '<Bot className="w-6 h-6 text-white" aria-hidden="true" />'
);

// We can probably drop `mt-1` to `mt-0.5` on the span.
code = code.replace(
  /<span className="mt-1 text-xs font-medium text-white whitespace-nowrap">/,
  '<span className="mt-0.5 text-[11px] font-medium text-white whitespace-nowrap">'
);

fs.writeFileSync('src/components/BottomNav.tsx', code, 'utf8');
console.log("Updated AI circle button size in BottomNav.");
