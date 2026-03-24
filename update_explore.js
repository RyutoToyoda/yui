const fs = require('fs');
let code = fs.readFileSync('src/app/explore/page.tsx', 'utf8');

// Fix X overflow by adding min-w-0 to the flex-1 column
code = code.replace(
  /<div className="flex flex-col flex-1 pb-1">/,
  '<div className="flex flex-col flex-1 min-w-0 pb-1">'
);

// Fix random spacing by removing mb-auto from the title and putting mt-auto on the info container
code = code.replace(
  /<h3 className="font-bold text-yui-green-800 text-2xl break-words leading-tight mb-auto pb-2">\{job\.title\}<\/h3>/,
  '<h3 className="font-bold text-yui-green-800 text-2xl break-words leading-tight pb-2">{job.title}</h3>'
);

code = code.replace(
  /<div className="space-y-1\.5">/,
  '<div className="space-y-1.5 mt-auto">'
);

// Another place where there could be min-w-0 missing?
// Maybe the container where JobCard is rendered? What about "flex flex-col items-end gap-1 shrink-0 h-full justify-between pb-0.5"?
// Let's just fix the main flex-1 column first.

fs.writeFileSync('src/app/explore/page.tsx', code, 'utf8');
