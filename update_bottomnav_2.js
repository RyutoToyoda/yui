const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

// Replace nav class
code = code.replace(
  /className="fixed md:hidden bottom-0 left-0 right-0 z-50 overflow-x-clip"/,
  'className="fixed md:hidden bottom-0 left-0 right-0 z-50 overflow-hidden"'
);

// Replace button styles
code = code.replace(
  /style=\{\{\s*width: "72px",\s*height: "72px",\s*right: "12px",\s*bottom: "84px",\s*boxShadow: "0 -4px 20px rgba\(23,126,52,0\.3\)",\s*\}\}/s,
  `style={{
            width: "140px",
            height: "140px",
            right: "-40px",
            bottom: "-40px",
            boxShadow: "0 -4px 20px rgba(23,126,52,0.3)",
          }}`
);

// Replace icon container
code = code.replace(
  /style=\{\{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", paddingTop: "4px" \}\}/s,
  `style={{ top: "28px", left: "28px" }}`
);

// Add the spacer back
code = code.replace(
  /\{\/\* Blank spacer for the AI circle area \*\/\}\s*<\/div>/s,
  `{/* Blank spacer for the AI circle area */}
            <div className="flex-[1.2]" style={{ minHeight: "56px" }} />
          </div>`
);

fs.writeFileSync('src/components/BottomNav.tsx', code, 'utf8');
