const fs = require('fs');

let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// I will just parse manually to ensure no regex errors.
const locStartRegex = /<div className="relative overflow-visible">/;
const locEndStr = '</LocationPickerMap>\n              </div>\n            </div>';

const startIndex = code.indexOf('<div className="relative overflow-visible">');
const endIndex = code.indexOf(locEndStr) + locEndStr.length;

if (startIndex !== -1 && endIndex !== -1) {
    const locBlock = code.substring(startIndex, endIndex);
    
    // Remove it
    code = code.substring(0, startIndex) + code.substring(endIndex);
    
    // Now insert it before Total Reward
    const totalRewardIndex = code.indexOf('<div className="flex justify-between items-center mb-1">');
    // We want the whole `div` block for Total Reward. So let's find the space-y-4 pt-4 above it
    const pt4Matches = [...code.matchAll(/<div className="space-y-4 pt-4">/g)];
    
    // Let's find the exact index of "合計のお礼" (Total Reward)
    const totalRewardKey = '合計のお礼';
    const totalRewardStringIndex = code.indexOf(totalRewardKey);
    
    // find the closest '<div className="space-y-4 pt-4">' before totalRewardStringIndex
    let insertIndex = -1;
    for (const match of pt4Matches) {
        if (match.index < totalRewardStringIndex) {
            insertIndex = match.index;
        } else {
            break;
        }
    }
    
    if (insertIndex !== -1) {
        // We'll insert it wrapped in whatever spacing it needs, but it had its own div.
        // wait, the location block we extracted starts with `<div className="relative overflow-visible">`
        // Should we wrap it in a `<div className="space-y-4 pt-4">` padding container? Yes.
        const wrappedLocBlock = `\n            <div className="space-y-4 pt-4">\n              ${locBlock}\n            </div>\n`;
        code = code.substring(0, insertIndex) + wrappedLocBlock + code.substring(insertIndex);
        
        fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
        console.log("Moved successfully.");
    } else {
        console.log("Could not find insert index.");
    }
} else {
    console.log("Could not extract locBlock");
}