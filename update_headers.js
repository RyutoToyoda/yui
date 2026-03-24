const fs = require('fs');

function updatePage(path) {
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');

    // Reduce wrapper top padding and spacing
    code = code.replace(
        /<div className="py-3 space-y-4 pb-20(.*?)"/,
        '<div className="pt-1 space-y-3 pb-20$1"'
    );
    
    // Some might have regular without capturing other classes if no other class
    code = code.replace(
        /<div className="py-3 space-y-4 pb-20">/,
        '<div className="pt-1 space-y-3 pb-20">'
    );

    // Remove pb-2 from header to reduce bottom spacing
    code = code.replace(
        /<h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 pb-2">/,
        '<h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-1">'
    );
    
    fs.writeFileSync(path, code, 'utf8');
}

updatePage('src/app/schedule/page.tsx');
updatePage('src/app/create/page.tsx');
updatePage('src/app/explore/page.tsx');

