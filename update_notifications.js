const fs = require('fs');

let content = fs.readFileSync('src/app/notifications/page.tsx', 'utf8');

content = content.replace(
  'case "job_cancelled": return <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />;',
  'case "job_cancelled": return <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />;\n      case "rejected": return <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />;'
);

content = content.replace(
  'case "job_cancelled": return "キャンセル";',
  'case "job_cancelled": return "キャンセル";\n      case "rejected": return "見送り";'
);

content = content.replace(
  'notif.type === "job_cancelled" ? "bg-red-100 border-red-200"',
  'notif.type === "job_cancelled" || notif.type === "rejected" ? "bg-red-100 border-red-200"'
);

// Wait the string breaks onto two lines in the file... Let's just replace job_cancelled with the double condition.
content = content.replace(/notif.type === "job_cancelled"/g, 'notif.type === "job_cancelled" || notif.type === "rejected"');


fs.writeFileSync('src/app/notifications/page.tsx', content);

console.log("Updated!");
