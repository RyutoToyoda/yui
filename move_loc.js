const fs = require('fs');

let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

const locMarkerStart = '{/* Location Container - Move this down */}';
const locMarkerEnd = '{/* End Location Container */}';

// Extract the content that looks like Location Container
// We'll just rely on string matching to move it.

// Note: I will use regex to find the Location block:
// {/* Location */} ... {/* Date */}

const split1 = code.indexOf('{/* Location */}');
const split2 = code.indexOf('{/* Date */}');

if (split1 > -1 && split2 > -1) {
    const locBlock = code.substring(split1, split2);
    code = code.substring(0, split1) + code.substring(split2);
    
    const split3 = code.indexOf('{/* Payment (Reward) */}');
    if (split3 > -1) {
        code = code.substring(0, split3) + locBlock + code.substring(split3);
        console.log("Moved Location Block!");
    } else {
        console.log("Could not find Payment Block");
    }
} else {
    console.log("Could not find Location Block");
}

fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');