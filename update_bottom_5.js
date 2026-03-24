const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

code = code.replace(/width: "200px"/, 'width: "140px"')
           .replace(/height: "200px"/, 'height: "140px"')
           .replace(/right: "-68px"/, 'right: "-44px"')
           .replace(/bottom: "-68px"/, 'bottom: "-44px"');

fs.writeFileSync('src/components/BottomNav.tsx', code, 'utf8');
