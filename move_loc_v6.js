const fs = require('fs');

let code = fs.readFileSync('src/app/create/page.tsx', 'utf8');

const sIdx = code.indexOf('<div className="relative overflow-visible">');
const eIdx = code.indexOf('</LocationPickerMap>') + '</LocationPickerMap>\n              </div>\n            </div>'.length;

const locBlock = code.substring(sIdx, eIdx);

code = code.substring(0, sIdx) + code.substring(eIdx);

const totalRewardString = '<div className="bg-yui-accent/10 rounded-xl p-4 flex items-center justify-between" role="status"';
const insertIdx = code.indexOf(totalRewardString);

if (insertIdx !== -1) {
    const wrapBlock = `<div className="space-y-4 pt-4">\n              ${locBlock}\n            </div>\n\n            `;
    code = code.substring(0, insertIdx) + wrapBlock + code.substring(insertIdx);
    fs.writeFileSync('src/app/create/page.tsx', code, 'utf8');
    console.log("Moved location successfuly");
} else {
    console.log("Could not find payment details");
}