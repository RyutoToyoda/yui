const fs = require('fs');

let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

const startIndex = code.indexOf('<div className="relative overflow-visible">');
const endIndex = code.indexOf('</LocationPickerMap>') + '</LocationPickerMap>\n              </div>\n            </div>'.length;

const locBlock = code.substring(startIndex, endIndex);

// Remove the location division block
code = code.substring(0, startIndex) + code.substring(endIndex);

// Let's find "合計のお礼" and figure out its container:
const searchStr = '<Coins className="text-yui-green-500 w-5 h-5" aria-hidden="true" />\n                合計のお礼';
const rewardIndex = code.indexOf('合計のお礼');

if(rewardIndex !== -1) {
    // The immediate parent is `<div className="space-y-4 pt-4">`
    const earlierDivs = [...code.matchAll(/<div className="space-y-4 pt-4">/g)];
    // We want the closest one before rewardIndex
    let targetIdx = -1;
    for (const match of earlierDivs) {
        if (match.index < rewardIndex) {
            targetIdx = match.index;
        }
    }
    
    if (targetIdx !== -1) {
        const wrapBlock = `<div className="space-y-4 pt-4">\n              ${locBlock}\n            </div>\n\n            `;
        code = code.substring(0, targetIdx) + wrapBlock + code.substring(targetIdx);
        fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
        console.log("Moved location successfuly");
    } else {
        console.log("Could not find div");
    }
} else {
    console.log("Could not find payment details");
}