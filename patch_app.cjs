const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'uiTheme={uiTheme}',
  'uiTheme={uiTheme}\n              reactorStyle={reactorStyle}'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
