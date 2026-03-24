const fs = require('fs');

let code = fs.readFileSync('src/components/HelpAdvisor.tsx', 'utf8');

// The touch action none breaks scrolling inside the modal! Let's clean it.
code = code.replace(/document\.body\.style\.touchAction = "none";/g, '');
code = code.replace(/document\.body\.style\.touchAction = "";/g, '');

// Check that the container allows scrolling natively
// Previous: className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 space-y-6 bg-gradient-to-b from-white to-yui-earth-50"
// We'll add overscroll-contain so scroll chains don't propagate to parent
code = code.replace(
  /className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 space-y-6 bg-gradient-to-b from-white to-yui-earth-50"/,
  'className="flex-1 overflow-y-auto overflow-x-hidden pt-4 md:pt-5 px-4 md:px-5 pb-32 md:pb-40 space-y-6 bg-gradient-to-b from-white to-yui-earth-50 overscroll-contain"'
);
// Also increase the pb spacing since the footer has a huge mic button that overlaps the bottom messages! 

fs.writeFileSync('src/components/HelpAdvisor.tsx', code, 'utf8');
console.log("Updated HelpAdvisor scrolling mechanisms.");
