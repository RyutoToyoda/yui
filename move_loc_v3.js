const fs = require('fs');

let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// Find the location component
const locStartRegex = /<div className="relative overflow-visible">\s*<label htmlFor="job-location"/;
const locEndStr = '</LocationPickerMap>\n              </div>\n            </div>';

// Find the section immediately following the target injection point
// Usually it's the Total Reward section or something after the time section.

const locStartMatch = code.match(locStartRegex);
if (locStartMatch) {
    const locStartIdx = locStartMatch.index;
    
    // We need to find the exact end of the location div to slice it out.
    // It's followed by another field, let's look for "</div>" that closes it.
    // It ends with: `/>\n                </div>\n              </div>\n            </div>`
    const nextLabelMatch = code.substring(locStartIdx).match(/<div className="flex justify-between items-center mb-1">/);
    if (nextLabelMatch) {
       // but wait, is the next element the Date/Time? No, Date/Time is currently BELOW location. 
       // In the previous output we saw `date` is right after.
       
       const dtStartMatch = code.substring(locStartIdx).match(/<div className="space-y-4 pt-4">/);
       if (dtStartMatch) {
           const endLocIdx = locStartIdx + dtStartMatch.index;
           const locBlock = code.substring(locStartIdx, endLocIdx);
           
           code = code.substring(0, locStartIdx) + code.substring(endLocIdx);
           
           // We removed it. Now we need to insert it *after* Time, *before* Total Reward.
           // Total reward starts with `<div className="space-y-4 pt-4">\s*<div className="flex justify-between items-center mb-1">`
           // Let's find: `合計のお礼`
           
           const rewardMatch = code.match(/<div className="space-y-4 pt-4">\s*<div className="flex justify-between items-center mb-1">\s*<label className="block text-base font-bold text-yui-earth-700 flex items-center gap-2">\s*<Coins className="text-yui-green-500 w-5 h-5"\s+\/>\s*合計のお礼/);
           
           if (rewardMatch) {
               code = code.substring(0, rewardMatch.index) + locBlock + code.substring(rewardMatch.index);
               console.log("Successfully moved location block before Total Reward");
               fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
           } else {
               console.log("Could not find Total Reward block");
               fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
           }
       }
    }
} else {
    console.log("Could not find locStartRegex");
}