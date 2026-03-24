const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

code = code.replace(/width: "200px"/, 'width: "72px"')
           .replace(/height: "200px"/, 'height: "72px"')
           .replace(/right: "-68px"/, 'right: "12px"')
           .replace(/bottom: "-68px"/, 'bottom: "84px"')
           .replace(/style={{ top: "36px", left: "48px" }}/, 'style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", paddingTop: "4px" }}')
           .replace(/w-10 h-10/, 'w-6 h-6')
           .replace(/mt-2 text-sm/, 'mt-1 text-[10px]')
           .replace(/minHeight: "64px"/g, 'minHeight: "56px"')
           .replace(/minWidth: "72px"/g, 'minWidth: "48px"')
           .replace(/minHeight: "48px"/g, 'minHeight: "32px"')
           .replace(/w-\[48px\] h-\[48px\]/g, 'w-6 h-6')
           .replace(/text-base mt-1/g, 'text-[11px] mt-1')
           .replace(/<div className="flex-\[1.2\]" style={{ minHeight: "52px" }} \/>/, '');

fs.writeFileSync('src/components/BottomNav.tsx', code, 'utf8');
