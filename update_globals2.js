const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

code = code.replace(
  /--ud-font-size-title: 28px;[\s\S]*?--ud-line-height: 1\.8;/,
  `--ud-font-size-title: 20px;      /* 2xl - Page headings */
  --ud-font-size-subtitle: 16px;   /* xl - Section headings */
  --ud-font-size-normal: 12px;     /* base - Body text */
  --ud-font-size-small: 10px;      /* sm - Labels, captions */
  --ud-line-height: 1.6;`
);

code = code.replace(
  /html\[data-font-size="large"\] \{[\s\S]*?\}/,
  `html[data-font-size="large"] {
  --ud-font-size-title: 24px;
  --ud-font-size-subtitle: 20px;
  --ud-font-size-normal: 14px;
  --ud-font-size-small: 12px;
}`
);

code = code.replace(
  /html\[data-font-size="xlarge"\] \{[\s\S]*?\}/,
  `html[data-font-size="xlarge"] {
  --ud-font-size-title: 28px;
  --ud-font-size-subtitle: 22px;
  --ud-font-size-normal: 16px;
  --ud-font-size-small: 14px;
}`
);

fs.writeFileSync('src/app/globals.css', code, 'utf8');
