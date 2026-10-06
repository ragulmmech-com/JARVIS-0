const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

const vars = `
@layer base {
  :root {
    --theme-primary: #00f3ff;
    --theme-secondary: #020b18;
  }
}
`;

if (!css.includes('--theme-primary')) {
  css = vars + css;
  fs.writeFileSync('src/index.css', css);
}
