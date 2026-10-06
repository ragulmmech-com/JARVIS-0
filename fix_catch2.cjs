const fs = require('fs');
['src/App.tsx', 'server.ts', 'src/lib/audioSynthesizer.ts'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/catch\s*\{\s*\}/g, 'catch(e) { console.debug("Ignored exception", e); }');
  code = code.replace(/catch\s*\{(?!\s*console)/g, 'catch(e) { console.debug("Ignored exception", e); ');
  fs.writeFileSync(file, code);
});
