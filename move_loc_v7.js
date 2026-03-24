const fs = require('fs');

const lines = fs.readFileSync('src/app/create/page.tsx', 'utf8').split('\n');

let locationStart = -1;
let locationEnd = -1;
let timeEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<div className="relative overflow-visible">') && locationStart === -1) {
        locationStart = i;
    }
    if (locationStart !== -1 && lines[i].includes('</LocationPickerMap>')) {
        // The closing divs for location block are a few lines down
        locationEnd = i + 3;
    }
    
    // Find the end of time block. Time block starts with <div className="space-y-5 w-full min-w-0 mt-4">
    if (lines[i].includes('<span className="text-base font-bold text-yui-earth-700">合計のお礼</span>')) {
        // The reward block starts a bit before this.
        // We'll just find the "bg-yui-accent/10" div
        for (let j = i; j >= 0; j--) {
            if (lines[j].includes('<div className="bg-yui-accent/10 rounded-xl p-4 flex items-center justify-between"')) {
                timeEnd = j - 1; // insert before this div
                break;
            }
        }
        break; // Stop after finding the insert point
    }
}

console.log({ locationStart, locationEnd, timeEnd });

if (locationStart !== -1 && locationEnd !== -1 && timeEnd !== -1) {
    const locBlock = lines.slice(locationStart, locationEnd + 1);
    
    // Remove location block from its original place
    lines.splice(locationStart, locBlock.length);
    
    // Recalculate timeEnd because we removed lines before it
    const newTimeEnd = timeEnd - locBlock.length;
    
    // Insert just before the reward block
    lines.splice(newTimeEnd, 0, '\n          ', ...locBlock);
    
    fs.writeFileSync('src/app/create/page.tsx', lines.join('\n'));
    console.log("Success!");
} else {
    console.log("Failed to find boundaries");
}
