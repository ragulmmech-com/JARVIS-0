const fs = require('fs');
let code = fs.readFileSync('src/lib/mediaUpload.ts', 'utf8');

// The replacement caused duplication:
//       } else if (isText) {
//         extractedText = await readFileAsText(file);
//         // Also provide data url for download/preview
//         url = await readFileAsDataUrl(file);
//       } else {
//         url = await readFileAsDataUrl(file);
//       }

code = code.replace(/      \} else if \(isText\) \{\s*extractedText = await readFileAsText\(file\);\s*\/\/ Also provide data url for download\/preview\s*url = await readFileAsDataUrl\(file\);\s*\} else \{\s*url = await readFileAsDataUrl\(file\);\s*\}/, "");

fs.writeFileSync('src/lib/mediaUpload.ts', code);
console.log("Syntax fixed");
