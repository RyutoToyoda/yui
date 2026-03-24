const fs = require('fs');
let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// Job Title Textarea
code = code.replace(
  /className="w-full px-4 py-3 text-2xl border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"/,
  'className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"'
);

// Job Type Buttons - adjust text size to be slightly bigger
code = code.replace(
  /<span className="block text-sm md:text-base">\{item.label\}<\/span>/g,
  '<span className="block text-base md:text-lg">{item.label}</span>'
);

// Location Input
code = code.replace(
  /className="w-full sm:flex-1 min-w-0 px-4 py-4 text-2xl border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"/,
  'className="w-full sm:flex-1 min-w-0 px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"'
);

// Date Input
code = code.replace(
  /className="w-full px-2 py-4 text-2xl text-center font-bold border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white font-mono tracking-tight"/,
  'className="w-full px-4 py-3 text-base text-center font-bold border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white font-mono"'
);

// Time Inputs (Start and End) - replace all simultaneously since they are the same
code = code.replace(
  /className="w-full flex-1 px-0\.5 py-4 text-2xl text-center font-bold border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white min-w-0 font-mono tracking-tight"/g,
  'className="w-full flex-1 px-2 py-3 text-base text-center font-bold border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white min-w-0 font-mono"'
);

// The tilde (～) between times
code = code.replace(
  /<span className="text-2xl font-bold text-yui-earth-500 shrink-0">～<\/span>/,
  '<span className="text-xl font-bold text-yui-earth-500 shrink-0">～</span>'
);

// Plus and Minus buttons for Required People (we leave them as text-2xl for visibility, maybe just text-xl)
code = code.replace(
  /className="w-12 h-12 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-2xl hover:bg-yui-green-200"/g,
  'className="w-10 h-10 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-xl hover:bg-yui-green-200"'
);

// People count span
code = code.replace(
  /<span className="text-2xl font-black text-yui-green-800 w-10 text-center">\{requiredPeople\}<\/span>/,
  '<span className="text-xl font-black text-yui-green-800 w-10 text-center">{requiredPeople}</span>'
);

fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
