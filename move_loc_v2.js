const fs = require('fs');
let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

// The Location block starts before <div className="space-y-4 pt-4"> and the Label "場所"
// It ends before the /* Date */ block, wait let's use the actual labels.

const locStartRegex = /<div className="space-y-4 pt-4">\s*<div>\s*<label className="block text-base font-bold text-yui-earth-700 mb-1 flex items-center gap-2">\s*<MapPin className="text-yui-green-500 w-5 h-5" \/>\s*場所\s*<\/label>/;
const dateStartRegex = /<div className="space-y-4 pt-4">\s*<div>\s*<label className="block text-base font-bold text-yui-earth-700 mb-1 flex items-center gap-2">\s*<CalendarIcon className="text-yui-green-500 w-5 h-5" \/>\s*日付\s*<\/label>/;
const rewardStartRegex = /<div className="space-y-4 pt-4">\s*<div className="flex justify-between items-center mb-1">\s*<label className="block text-base font-bold text-yui-earth-700 flex items-center gap-2">\s*<Coins className="text-yui-green-500 w-5 h-5" \/>\s*合計のお礼\s*<\/label>/;

const locMatches = code.match(locStartRegex);
const dateMatches = code.match(dateStartRegex);
const rewardMatches = code.match(rewardStartRegex);

if (locMatches && dateMatches && rewardMatches) {
    const startLoc = locMatches.index;
    const endLoc = dateMatches.index;
    const locBlock = code.substring(startLoc, endLoc);
    
    // Remove loc block from original spot
    code = code.substring(0, startLoc) + code.substring(endLoc);
    
    // Find reward start in the NEW code string
    const newRewardMatches = code.match(rewardStartRegex);
    if (newRewardMatches) {
        const rewardStart = newRewardMatches.index;
        code = code.substring(0, rewardStart) + locBlock + code.substring(rewardStart);
        console.log("Successfully moved the location block below time, but before reward.");
        fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
    } else {
        console.log("Could not find reward block after removing location.");
    }
} else {
    console.log("Could not find all blocks.");
    console.log("locMatch:", !!locMatches);
    console.log("dateMatch:", !!dateMatches);
    console.log("rewardMatch:", !!rewardMatches);
}
