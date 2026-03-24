const fs = require('fs');

let code = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

const target = `<div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-yui-green-200 text-sm font-medium">{user.farmName}</p>`;

const replacement = `<div className="flex items-center gap-4 mt-2">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              {user.farmName && <p className="text-yui-green-100 text-base font-medium">{user.farmName}</p>}
            </div>
          </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/app/profile/page.tsx', code, 'utf8');
  console.log("Updated Profile header layout.");
} else {
  // Let's try Regex if exact match fails
  const ptn = /<div className="w-16 h-16 bg-white\/20 rounded-full flex items-center justify-center mb-3">[\s\S]*?<User className="w-8 h-8 text-white" aria-hidden="true" \/>[\s\S]*?<\/div>[\s\S]*?<h2 className="text-xl font-bold">\{user\.name\}<\/h2>[\s\S]*?<p className="text-yui-green-200 text-sm font-medium">\{user\.farmName\}<\/p>/m;
  
  if (ptn.test(code)) {
    code = code.replace(ptn, replacement);
    fs.writeFileSync('src/app/profile/page.tsx', code, 'utf8');
    console.log("Updated Profile header layout using regex.");
  } else {
    console.log("Could not find the target code to replace.");
  }
}
