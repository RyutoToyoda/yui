const fs = require('fs');

const lines = fs.readFileSync('src/app/create/page.tsx', 'utf8').split('\n');

let locationStart = -1;
let locationEnd = -1;
let timeEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<div className="relative overflow-visible">') && locationStart === -1) {
        locationStart = i;
    }
    
    // Time block starts at `<div className="space-y-5 w-full min-w-0 mt-4">`
    if (locationStart !== -1 && locationEnd === -1 && lines[i].includes('<div className="space-y-5 w-full min-w-0 mt-4">')) {
        // The location block must end just before this
        // Let's walk backwards to the first '</div>' which should be the closing of `<div className="relative overflow-visible">`
        let count = 0;
        for (let j = i - 1; j >= locationStart; j--) {
            if (lines[j].trim() === '</div>') {
                count++;
                if (count === 1) { // just find the outermost div that ends before Time start
                    locationEnd = j; // wait, the last </div> before space-y-5. That might be it. Actually, space-y-5 has a blank line above it
                }
            }
            if (lines[j].includes('</div>') && locationEnd === -1) {
                locationEnd = j;
            }
        }
    }
    
    if (lines[i].includes('<span className="text-base font-bold text-yui-earth-700">合計のお礼</span>')) {
        for (let j = i; j >= 0; j--) {
            if (lines[j].includes('<div className="bg-yui-accent/10 rounded-xl p-4 flex items-center justify-between"')) {
                timeEnd = j - 1; 
                break;
            }
        }
        break; 
    }
}

console.log({ locationStart, locationEnd, timeEnd });

if (locationStart !== -1 && locationEnd !== -1 && timeEnd !== -1) {
    const locBlock = lines.slice(locationStart, locationEnd + 1);
    
    lines.splice(locationStart, locBlock.length);
    const newTimeEnd = timeEnd - locBlock.length;
    
    // add an empty line for spacing
    lines.splice(newTimeEnd, 0, '', ...locBlock, '');
    
    fs.writeFileSync('src/app/create/page.tsx', lines.join('\n'));
    console.log("Success!");
} else {
    console.log("Failed to find boundaries");
}
