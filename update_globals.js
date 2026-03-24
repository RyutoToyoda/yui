const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

code = code.replace(
  /:root \{\n  \/\* 普通 - Standard Mode \*\/\n  --ud-font-size-title: 28px;      \/\* 2xl - Page headings \*\/\n  --ud-font-size-subtitle: 22px;   \/\* xl - Section headings \*\/\n  --ud-font-size-normal: 16px;     \/\* base - Body text \*\/\n  --ud-font-size-small: 16px;      \/\* sm - Labels, captions \*\/\n  --ud-line-height: 1\.8;\n\}/g,
  `:root {
  /* 普通 - Standard Mode */
  --ud-font-size-title: 20px;      /* 2xl - Page headings */
  --ud-font-size-subtitle: 16px;   /* xl - Section headings */
  --ud-font-size-normal: 12px;     /* base - Body text */
  --ud-font-size-small: 10px;      /* sm - Labels, captions */
  --ud-line-height: 1.6;
}`
);

code = code.replace(
  /\/\* 大きめ文字モード - Large Mode \*\/\nhtml\[data-font-size="large"\] \{\n  --ud-font-size-title: 30px;\n  --ud-font-size-subtitle: 24px;\n  --ud-font-size-normal: 18px;\n  --ud-font-size-small: 17px;\n\}/g,
  `/* 大きめ文字モード - Large Mode */
html[data-font-size="large"] {
  --ud-font-size-title: 24px;
  --ud-font-size-subtitle: 20px;
  --ud-font-size-normal: 14px;
  --ud-font-size-small: 12px;
}`
);

code = code.replace(
  /\/\* とても大きい文字モード - Extra Large Mode \*\/\nhtml\[data-font-size="xlarge"\] \{\n  --ud-font-size-title: 34px;\n  --ud-font-size-subtitle: 28px;\n  --ud-font-size-normal: 20px;\n  --ud-font-size-small: 19px;\n\}/g,
  `/* とても大きい文字モード - Extra Large Mode */
html[data-font-size="xlarge"] {
  --ud-font-size-title: 28px;
  --ud-font-size-subtitle: 22px;
  --ud-font-size-normal: 16px;
  --ud-font-size-small: 14px;
}`
);

fs.writeFileSync('src/app/globals.css', code, 'utf8');
